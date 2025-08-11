import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ChefDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const refreshStatus = async () => {
    const { data, error } = await supabase.functions.invoke("connect-check-status");
    if (!error) setStatus(data);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const startOnboarding = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("connect-create-account");
    setLoading(false);
    if (error) return alert(error.message || "Error starting onboarding");
    if (data?.url) window.location.href = data.url;
  };

  return (
    <div>
      <Helmet>
        <title>Chef Dashboard | Homemade</title>
        <meta name="description" content="Set up payouts and manage your chef profile on Homemade." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://homemade.app/chef-dashboard"} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto px-4 py-12">
        <section className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Chef dashboard</h1>
          <p className="text-sm text-muted-foreground">Connect your bank via Stripe to receive payouts for your orders.</p>
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div>
              <p className="font-medium">Payouts via Stripe Connect</p>
              <p className="text-sm text-muted-foreground">Status: {status ? (status.onboarding_complete ? "Onboarding complete" : "Action required") : "Unknown"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={startOnboarding} disabled={loading}>
                {loading ? "Redirecting..." : status?.onboarding_complete ? "Manage account" : "Set up payouts"}
              </Button>
              <Button variant="secondary" onClick={refreshStatus}>Refresh status</Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChefDashboard;
