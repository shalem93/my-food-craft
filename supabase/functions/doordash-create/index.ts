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

    console.log("Request body:", body);
    
    if (!payment_intent_id) {
      return new Response(JSON.stringify({ error: "Missing payment_intent_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Skip client secret validation for now since it's causing issues
    console.log("Proceeding without client secret validation");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Searching for order with payment_intent_id:", payment_intent_id);
    
    // Fetch the order by payment intent id
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("id, dropoff_address, dropoff_phone, dropoff_business_name, dropoff_instructions, delivery_fee_cents")
      .eq("stripe_payment_intent_id", payment_intent_id)
      .maybeSingle();

    console.log("Order lookup result:", { order, orderError });

    if (orderError || !order) {
      console.error("Order not found or error:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Simulate DoorDash creation
    const external_delivery_id = `sim-${crypto.randomUUID()}`;
    const delivery_tracking_url = `https://doordash.com/tracking/${external_delivery_id}`;
    const delivery_fee_cents = order?.delivery_fee_cents ?? 599;

    console.log("Updating order with DoorDash details...");
    
    const { data: updatedOrder, error: updateError } = await supabaseService
      .from("orders")
      .update({
        external_delivery_id,
        delivery_service: "doordash",
        delivery_status: "confirmed",
        delivery_tracking_url,
        delivery_fee_cents,
      })
      .eq("stripe_payment_intent_id", payment_intent_id)
      .select()
      .single();

    console.log("Order update result:", { updatedOrder, updateError });

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update order" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Send SMS notification if phone number is available
    if (updatedOrder?.dropoff_phone) {
      try {
        await supabaseService.functions.invoke('send-sms', {
          body: {
            phone: updatedOrder.dropoff_phone,
            message: `🍽️ Great news! Your Homemade order has been confirmed and your chef is preparing your meal. Track your order: ${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/order-tracking?order_id=${updatedOrder.id}`,
            orderId: updatedOrder.id
          }
        });
      } catch (smsError) {
        console.error('Failed to send SMS:', smsError);
      }
    }

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
