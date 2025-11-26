import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("DoorDash webhook received:", JSON.stringify(payload, null, 2));

    // DoorDash webhook format:
    // {
    //   "event_name": "DASHER_CONFIRMED" | "DASHER_CONFIRMED_PICKUP_ARRIVAL" | "DASHER_PICKED_UP" | "DASHER_CONFIRMED_DROPOFF_ARRIVAL" | "DASHER_DROPPED_OFF" | "DELIVERY_CANCELLED",
    //   "external_delivery_id": "your-order-id",
    //   "created_at": "2025-11-26T00:00:00Z",
    //   ...
    // }

    const { event_name, external_delivery_id } = payload;

    if (!external_delivery_id) {
      console.log("No external_delivery_id in webhook payload");
      return new Response(
        JSON.stringify({ success: true, message: "No external_delivery_id" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Map DoorDash event names to our delivery statuses
    let ourStatus: string | null = null;
    
    switch (event_name) {
      case "DASHER_CONFIRMED":
        ourStatus = "confirmed";
        break;
      case "DASHER_CONFIRMED_PICKUP_ARRIVAL":
        ourStatus = "dasher_arriving";
        break;
      case "DASHER_PICKED_UP":
        ourStatus = "picked_up";
        break;
      case "DASHER_CONFIRMED_DROPOFF_ARRIVAL":
        ourStatus = "arriving_at_dropoff";
        break;
      case "DASHER_DROPPED_OFF":
        ourStatus = "delivered";
        break;
      case "DELIVERY_CANCELLED":
        ourStatus = "cancelled";
        break;
      default:
        console.log(`Unknown event_name: ${event_name}`);
        return new Response(
          JSON.stringify({ success: true, message: "Event type not handled" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
    }

    console.log(`Updating order ${external_delivery_id} to status: ${ourStatus}`);

    // Update the order in the database
    const { data: updateData, error: updateError } = await supabaseClient
      .from("orders")
      .update({ 
        delivery_status: ourStatus,
        updated_at: new Date().toISOString()
      })
      .eq("external_delivery_id", external_delivery_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    console.log("Order updated successfully:", updateData);

    // TODO: Send SMS notification to user
    // You can call the send-sms edge function here if needed

    return new Response(
      JSON.stringify({ success: true, status: ourStatus, external_delivery_id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
