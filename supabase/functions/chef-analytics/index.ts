// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth (verify_jwt = true by default)
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

    // Fetch last 60 days of orders for this chef
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const { data: orders, error } = await (supabaseService as any)
      .from("orders")
      .select("id, amount, currency, created_at, status")
      .eq("chef_user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const byDay = new Map<string, number>();
    let totalEarningsCents = 0;
    let orderCount = 0;

    for (const o of orders || []) {
      const d = new Date(o.created_at);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const amt = Number(o.amount || 0);
      byDay.set(key, (byDay.get(key) || 0) + amt);
      totalEarningsCents += amt;
      orderCount += 1;
    }

    // Build last 30 days series with zeros for missing days
    const earnings: Array<{ date: string; total_cents: number }> = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      earnings.push({ date: key, total_cents: byDay.get(key) || 0 });
    }

    const avgOrderValueCents = orderCount > 0 ? Math.round(totalEarningsCents / orderCount) : 0;

    // Recent orders (last 5)
    const { data: recentOrders, error: recentErr } = await (supabaseService as any)
      .from("orders")
      .select("id, amount, currency, created_at, status")
      .eq("chef_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentErr) throw recentErr;

    return new Response(
      JSON.stringify({
        metrics: {
          totalEarningsCents,
          orderCount,
          avgOrderValueCents,
          currency: (orders && orders[0]?.currency) || "usd",
        },
        earnings,
        recentOrders,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("chef-analytics error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
