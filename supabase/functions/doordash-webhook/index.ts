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

    // DoorDash sends events with this structure:
    // {
    //   "event_id": "string",
    //   "event_type": "delivery_status",
    //   "event_time": "2024-01-01T00:00:00Z",
    //   "data": {
    //     "external_delivery_id": "your-order-id",
    //     "delivery_status": "dasher_confirmed" | "dasher_confirmed_arrival" | "pickup_complete" | "dropoff_complete",
    //     ...
    //   }
    // }

    const { event_type, data } = payload;

    if (event_type === "delivery_status") {
      const { external_delivery_id, delivery_status } = data;

      // Map DoorDash status to our status
      let ourStatus = delivery_status;
      
      // Map DoorDash statuses to more user-friendly ones
      if (delivery_status === "dasher_confirmed") {
        ourStatus = "confirmed";
      } else if (delivery_status === "dasher_confirmed_arrival") {
        ourStatus = "dasher_arriving";
      } else if (delivery_status === "pickup_complete") {
        ourStatus = "picked_up";
      } else if (delivery_status === "dropoff_complete") {
        ourStatus = "delivered";
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
        JSON.stringify({ success: true, status: ourStatus }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // For other event types, just acknowledge receipt
    return new Response(
      JSON.stringify({ success: true, message: "Event received" }),
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
