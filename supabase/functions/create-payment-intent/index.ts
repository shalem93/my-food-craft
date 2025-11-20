import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PaymentIntentSchema = z.object({
  amount: z.number().int().min(50).max(1000000),
  currency: z.string().min(3).max(3).default("usd"),
  chef_user_id: z.string().uuid().nullable().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT verification is now enforced at the edge function level (verify_jwt = true)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const jwt = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAnon.auth.getUser(jwt);
    
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = authData.user;

    // Validate input
    const body = await req.json();
    const validated = PaymentIntentSchema.parse(body);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let transferData: { destination: string } | undefined = undefined;
    if (validated.chef_user_id) {
      const { data: chefs } = await supabaseAnon
        .from("chef_profiles")
        .select("stripe_account_id,onboarding_complete")
        .eq("user_id", validated.chef_user_id)
        .maybeSingle();

      if (chefs?.stripe_account_id && chefs.onboarding_complete) {
        transferData = { destination: chefs.stripe_account_id };
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: validated.amount,
      currency: validated.currency,
      automatic_payment_methods: { enabled: true },
      ...(transferData ? { transfer_data: transferData } : {}),
      metadata: {
        platform: "homemade",
        user_id: user.id,
        chef_user_id: validated.chef_user_id || "",
      },
    });

    // Record order using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: inserted } = await supabaseService.from("orders").insert({
      user_id: user.id,
      chef_user_id: validated.chef_user_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount: validated.amount,
      currency: validated.currency,
      status: paymentIntent.status,
    }).select("id").maybeSingle();

    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret, 
        payment_intent_id: paymentIntent.id, 
        order_id: inserted?.id || null 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Payment intent error:", err);
    if (err instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input", details: err.errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});