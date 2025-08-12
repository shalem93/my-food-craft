import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || `${url.protocol}//${url.host}`;

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const { data: authData } = jwt ? await supabaseAnon.auth.getUser(jwt) : { data: { user: null } } as any;
    const user = authData?.user ?? null;

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const currency = (body.currency as string) || "usd";
    const chefUserId = (body.chef_user_id as string) || null;

    if (!Number.isInteger(amount) || amount < 50) {
      return new Response(JSON.stringify({ error: "Invalid amount (must be cents)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let transferData: { destination: string } | undefined = undefined;
    if (chefUserId) {
      // Lookup chef's connected account
      const { data: chefs, error } = await supabaseAnon
        .from("chef_profiles")
        .select("stripe_account_id,onboarding_complete")
        .eq("user_id", chefUserId)
        .maybeSingle();

      if (!error && chefs?.stripe_account_id && chefs.onboarding_complete) {
        transferData = { destination: chefs.stripe_account_id };
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      ...(transferData ? { transfer_data: transferData } : {}),
      metadata: {
        platform: "homemade",
        user_id: user?.id || "guest",
        chef_user_id: chefUserId || "",
      },
    });

    // Record order
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: inserted, error: insertError } = await supabaseService.from("orders").insert({
      user_id: user?.id ?? null,
      chef_user_id: chefUserId,
      stripe_payment_intent_id: paymentIntent.id,
      amount,
      currency,
      status: paymentIntent.status,
    }).select("id").maybeSingle();

    const order_id = inserted?.id || null;

    return new Response(
      JSON.stringify({ client_secret: paymentIntent.client_secret, payment_intent_id: paymentIntent.id, order_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
