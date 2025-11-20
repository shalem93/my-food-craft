import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DeliveryCreateSchema = z.object({
  payment_intent_id: z.string().min(1),
  payment_intent_client_secret: z.string().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT verification enforced at edge function level
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: authData, error: authError } = await supabaseAnon.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const validated = DeliveryCreateSchema.parse(body);

    console.log("Request validated:", validated);

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Searching for order with payment_intent_id:", validated.payment_intent_id);
    
    // Fetch the order by payment intent id - verify user owns it
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select(`
        id, 
        user_id,
        chef_user_id,
        dropoff_address, 
        dropoff_phone, 
        dropoff_business_name, 
        dropoff_instructions, 
        delivery_fee_cents
      `)
      .eq("stripe_payment_intent_id", validated.payment_intent_id)
      .eq("user_id", authData.user.id) // Verify ownership
      .maybeSingle();

    console.log("Order lookup result:", { order, orderError });

    if (orderError || !order) {
      console.error("Order not found or unauthorized:", orderError);
      return new Response(JSON.stringify({ error: "Order not found or unauthorized" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Fetch chef profile for pickup address
    let chefProfile = null;
    if (order.chef_user_id) {
      const { data: profile } = await supabaseService
        .from("chef_profiles")
        .select("pickup_address, pickup_phone, pickup_business_name, city, zip")
        .eq("user_id", order.chef_user_id)
        .maybeSingle();
      chefProfile = profile;
    }

    console.log("Chef profile for pickup:", chefProfile);

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
        pickup_address: chefProfile?.pickup_address || null,
        pickup_phone: chefProfile?.pickup_phone || null,
        pickup_business_name: chefProfile?.pickup_business_name || null,
      })
      .eq("stripe_payment_intent_id", validated.payment_intent_id)
      .eq("user_id", authData.user.id) // Verify ownership
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
            message: `Your Homemade order has been confirmed! Track it here: ${delivery_tracking_url}`,
            orderId: updatedOrder.id,
          },
        });
      } catch (smsError) {
        console.error("SMS notification failed (non-critical):", smsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        external_delivery_id,
        delivery_tracking_url,
        delivery_status: "confirmed",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Delivery creation error:", err);
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