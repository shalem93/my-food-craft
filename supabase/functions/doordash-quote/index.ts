import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QuoteSchema = z.object({
  dropoff_address: z.string().min(5).max(200),
  dropoff_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format"),
  dropoff_business_name: z.string().max(100).optional(),
  dropoff_instructions: z.string().max(500).optional(),
  pickup_address: z.string().min(5).max(200),
});

// Base64url decode helper
function base64UrlDecode(base64Url: string): Uint8Array {
  // Replace URL-safe characters
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Padded = base64 + padding;
  
  // Decode base64 to binary string
  const binaryString = atob(base64Padded);
  
  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Generate DoorDash JWT
async function generateDoorDashJWT() {
  const keyId = Deno.env.get("DOORDASH_KEY_ID");
  const developerId = Deno.env.get("DOORDASH_DEVELOPER_ID");
  const signingSecret = Deno.env.get("DOORDASH_SIGNING_SECRET");

  if (!keyId || !developerId || !signingSecret) {
    throw new Error("Missing DoorDash credentials");
  }

  const header = { alg: "HS256", typ: "JWT", "dd-ver": "DD-JWT-V1" };
  const payload = {
    aud: "doordash",
    iss: developerId,
    kid: keyId,
    exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    iat: Math.floor(Date.now() / 1000),
  };

  // Decode the base64url-encoded signing secret
  const decodedSecret = base64UrlDecode(signingSecret);
  
  const key = await crypto.subtle.importKey(
    "raw",
    decodedSecret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return await create(header, payload, key);
}

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const validated = QuoteSchema.parse(body);

    console.log("Getting quote from DoorDash API for:", validated);

    // Generate JWT for DoorDash API
    const jwt = await generateDoorDashJWT();

    // Call DoorDash Drive API for quote
    const quoteResponse = await fetch("https://openapi.doordash.com/drive/v2/quotes", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_delivery_id: `quote-${crypto.randomUUID()}`,
        pickup_address: validated.pickup_address,
        pickup_phone_number: validated.dropoff_phone,
        dropoff_address: validated.dropoff_address,
        dropoff_phone_number: validated.dropoff_phone,
        dropoff_business_name: validated.dropoff_business_name,
        dropoff_instructions: validated.dropoff_instructions,
        order_value: 5000, // Default value for quote
      }),
    });

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error("DoorDash API error:", errorText);
      
      // Parse error for better user feedback
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.reason === "distance_too_long") {
          return new Response(
            JSON.stringify({ 
              error: "Distance too long", 
              message: "The delivery distance exceeds DoorDash's service area. Please use addresses that are closer together." 
            }), 
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      } catch (e) {
        // If parsing fails, continue with generic error
      }
      
      throw new Error(`DoorDash API error: ${quoteResponse.status}`);
    }

    const quoteData = await quoteResponse.json();
    console.log("DoorDash quote response:", quoteData);

    // Extract fee from response (in cents)
    const delivery_fee_cents = quoteData.fee || 599;

    return new Response(JSON.stringify({ delivery_fee_cents, currency: "usd" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Quote error:", err);
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
