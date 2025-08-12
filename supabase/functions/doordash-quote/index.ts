import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const dropoff_address: string = body.dropoff_address || "";
    const dropoff_phone: string = body.dropoff_phone || "";
    const dropoff_business_name: string | undefined = body.dropoff_business_name || undefined;
    const dropoff_instructions: string | undefined = body.dropoff_instructions || undefined;

    if (!dropoff_address || !dropoff_phone) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Public, simulated flat fee quote (in cents)
    const delivery_fee_cents = 599; // $5.99 simulated estimate

    return new Response(JSON.stringify({ delivery_fee_cents, currency: "usd" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
