// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify auth
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const { data: { user } } = await supabaseAnon.auth.getUser(jwt ?? "");
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { action } = body;

    // Get chef profile with Stripe account
    const { data: chefProfile, error: chefError } = await (supabaseService as any)
      .from("chef_profiles")
      .select("stripe_account_id, display_name")
      .eq("user_id", user.id)
      .single();

    if (chefError || !chefProfile) {
      return new Response(JSON.stringify({ error: "Chef profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!chefProfile.stripe_account_id) {
      return new Response(JSON.stringify({ error: "Stripe Connect account not set up" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-balance") {
      // Fetch the balance from Stripe Connect account
      const balance = await stripe.balance.retrieve({
        stripeAccount: chefProfile.stripe_account_id,
      });

      // Get available balance (what can be paid out)
      const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
      const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0);
      // Instant available - what can be instantly paid out to a debit card
      const instantAvailable = balance.instant_available?.reduce((sum, b) => sum + b.amount, 0) || 0;
      const currency = balance.available[0]?.currency || "usd";

      // Get payout history
      const { data: payouts, error: payoutsError } = await (supabaseService as any)
        .from("chef_payouts")
        .select("*")
        .eq("chef_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (payoutsError) {
        console.error("Error fetching payouts:", payoutsError);
      }

      return new Response(
        JSON.stringify({
          available_cents: available,
          pending_cents: pending,
          instant_available_cents: instantAvailable,
          currency,
          payouts: payouts || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "request-payout") {
      const { amount_cents, instant } = body;

      if (!amount_cents || amount_cents < 100) {
        return new Response(JSON.stringify({ error: "Minimum payout is $1.00" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check available balance - for instant payouts, check instant_available
      const balance = await stripe.balance.retrieve({
        stripeAccount: chefProfile.stripe_account_id,
      });
      
      const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
      const instantAvailable = balance.instant_available?.reduce((sum, b) => sum + b.amount, 0) || 0;

      // For instant payouts, check instant_available balance
      if (instant && amount_cents > instantAvailable) {
        return new Response(JSON.stringify({ 
          error: "Insufficient balance for instant payout. Try standard payout instead.",
          available_cents: available,
          instant_available_cents: instantAvailable
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!instant && amount_cents > available) {
        return new Response(JSON.stringify({ error: "Insufficient balance" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate fee for instant payouts (typically 1% with $0.50 minimum, capped)
      const instantFee = instant ? Math.max(50, Math.round(amount_cents * 0.01)) : 0;

      // Create payout record first
      const { data: payoutRecord, error: insertError } = await (supabaseService as any)
        .from("chef_payouts")
        .insert({
          chef_user_id: user.id,
          amount_cents,
          currency: "usd",
          status: "processing",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating payout record:", insertError);
        throw new Error("Failed to create payout record");
      }

      try {
        // Create a payout to the chef's bank/debit card via Stripe Connect
        const payoutParams: any = {
          amount: amount_cents,
          currency: "usd",
          description: `${instant ? 'Instant ' : ''}Payout for ${chefProfile.display_name || "Chef"}`,
        };

        // Add instant payout method if requested
        if (instant) {
          payoutParams.method = "instant";
        }

        const payout = await stripe.payouts.create(
          payoutParams,
          {
            stripeAccount: chefProfile.stripe_account_id,
          }
        );

        // Update record with Stripe payout ID
        await (supabaseService as any)
          .from("chef_payouts")
          .update({
            stripe_payout_id: payout.id,
            status: payout.status === "paid" ? "completed" : "processing",
          })
          .eq("id", payoutRecord.id);

        return new Response(
          JSON.stringify({
            success: true,
            payout_id: payoutRecord.id,
            stripe_payout_id: payout.id,
            status: payout.status,
            amount_cents,
            instant,
            fee_cents: instantFee,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (stripeError: any) {
        // Update record with failure
        await (supabaseService as any)
          .from("chef_payouts")
          .update({
            status: "failed",
            failure_reason: stripeError.message,
          })
          .eq("id", payoutRecord.id);

        console.error("Stripe payout error:", stripeError);
        
        // Provide helpful error message for instant payout failures
        let errorMessage = stripeError.message || "Payout failed";
        if (instant && stripeError.code === "instant_payouts_unsupported") {
          errorMessage = "Instant payouts are not available for this account. Please add a debit card to your Stripe account, or use standard payout.";
        }
        
        return new Response(
          JSON.stringify({ error: errorMessage, code: stripeError.code }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("chef-payout error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
