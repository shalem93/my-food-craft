import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const body = await req.json().catch(() => ({}));
    const payment_intent_id: string | undefined = body.payment_intent_id;
    const payment_intent_client_secret: string | undefined = body.payment_intent_client_secret;

    if (!payment_intent_id || !payment_intent_client_secret) {
      return new Response(JSON.stringify({ error: "Missing payment_intent_id or client secret" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Simple verification: ensure client secret corresponds to the given PaymentIntent id
    if (!payment_intent_client_secret.startsWith(`${payment_intent_id}_secret_`)) {
      return new Response(JSON.stringify({ error: "Invalid client secret" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch the order by payment intent id
    const { data: order } = await supabaseService
      .from("orders")
      .select("id, dropoff_address, dropoff_phone, dropoff_business_name, dropoff_instructions, delivery_fee_cents")
      .eq("stripe_payment_intent_id", payment_intent_id)
      .maybeSingle();

    // Simulate DoorDash creation
    const external_delivery_id = `sim-${crypto.randomUUID()}`;
    const delivery_tracking_url = `https://doordash.com/tracking/${external_delivery_id}`;
    const delivery_fee_cents = order?.delivery_fee_cents ?? 599;

    await supabaseService
      .from("orders")
      .update({
        external_delivery_id,
        delivery_service: "doordash",
        delivery_status: "created",
        delivery_tracking_url,
        delivery_fee_cents,
      })
      .eq("stripe_payment_intent_id", payment_intent_id);

    return new Response(JSON.stringify({
      external_delivery_id,
      delivery_tracking_url,
      delivery_status: "created",
      delivery_fee_cents,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
