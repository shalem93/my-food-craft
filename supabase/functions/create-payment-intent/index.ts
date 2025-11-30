import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Platform fees configuration
const PLATFORM_COMMISSION_RATE = 0.10; // 10% of food subtotal goes to platform
const SERVICE_FEE_CENTS = 299; // $2.99 flat service fee

const PaymentIntentSchema = z.object({
  amount: z.number().int().min(50).max(1000000), // Food subtotal in cents
  service_fee_cents: z.number().int().default(SERVICE_FEE_CENTS),
  delivery_fee_cents: z.number().int().nullable().optional(),
  currency: z.string().min(3).max(3).default("usd"),
  chef_user_id: z.string().uuid().nullable().optional(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid().optional(),
    name: z.string(),
    price_cents: z.number().int(),
    quantity: z.number().int().min(1),
  })).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const foodSubtotalCents = validated.amount;
    const serviceFeeCents = validated.service_fee_cents;
    const deliveryFeeCents = validated.delivery_fee_cents || 0;
    
    // Calculate total charge amount (food + service fee + delivery)
    const totalAmountCents = foodSubtotalCents + serviceFeeCents + deliveryFeeCents;
    
    // Platform takes: 10% of food subtotal + 100% of service fee
    // Chef gets: 90% of food subtotal (delivery fee is separate)
    const platformCommissionCents = Math.round(foodSubtotalCents * PLATFORM_COMMISSION_RATE);
    const applicationFeeCents = platformCommissionCents + serviceFeeCents;

    console.log(`Payment breakdown: food=${foodSubtotalCents}, service=${serviceFeeCents}, delivery=${deliveryFeeCents}, total=${totalAmountCents}, platformFee=${applicationFeeCents}`);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let transferData: { destination: string } | undefined = undefined;
    let useApplicationFee = false;
    
    if (validated.chef_user_id) {
      const { data: chefs } = await supabaseAnon
        .from("chef_profiles")
        .select("stripe_account_id,onboarding_complete")
        .eq("user_id", validated.chef_user_id)
        .maybeSingle();

      if (chefs?.stripe_account_id && chefs.onboarding_complete) {
        transferData = { destination: chefs.stripe_account_id };
        useApplicationFee = true;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: validated.currency,
      automatic_payment_methods: { enabled: true },
      ...(transferData ? { transfer_data: transferData } : {}),
      ...(useApplicationFee ? { application_fee_amount: applicationFeeCents } : {}),
      metadata: {
        platform: "homemade",
        user_id: user.id,
        chef_user_id: validated.chef_user_id || "",
        food_subtotal_cents: String(foodSubtotalCents),
        service_fee_cents: String(serviceFeeCents),
        delivery_fee_cents: String(deliveryFeeCents),
        platform_commission_cents: String(platformCommissionCents),
        application_fee_cents: String(applicationFeeCents),
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
      amount: totalAmountCents,
      currency: validated.currency,
      status: paymentIntent.status,
      delivery_fee_cents: deliveryFeeCents || null,
    }).select("id").maybeSingle();

    // Save order items if provided
    if (inserted?.id && validated.items && validated.items.length > 0) {
      const orderItems = validated.items.map(item => ({
        order_id: inserted.id,
        menu_item_id: item.menu_item_id || '00000000-0000-0000-0000-000000000000',
        item_name: item.name,
        price_cents: item.price_cents,
        quantity: item.quantity,
      }));

      await supabaseService.from("order_items").insert(orderItems);
    }

    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret, 
        payment_intent_id: paymentIntent.id, 
        order_id: inserted?.id || null,
        fees: {
          food_subtotal_cents: foodSubtotalCents,
          service_fee_cents: serviceFeeCents,
          delivery_fee_cents: deliveryFeeCents,
          platform_commission_cents: platformCommissionCents,
          total_cents: totalAmountCents,
        }
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
