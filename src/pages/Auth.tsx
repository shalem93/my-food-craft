import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [role, setRole] = useState<AppRole>("customer");
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await signIn(email, password);
    setBusy(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await signUp(suEmail, suPassword, role);
    setBusy(false);
  };

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <Helmet>
        <title>Sign in or Sign up | Homemade</title>
        <meta name="description" content="Join Homemade to order from local chefs or become a chef and get paid with Stripe." />
        <link rel="canonical" href={`${window.location.origin}/auth`} />
      </Helmet>

      <h1 className="sr-only">Sign in or create an account — Homemade</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section aria-label="Authentication" className="order-2 lg:order-1">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Welcome to Homemade</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="pt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={busy} className="w-full">Sign in</Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="pt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-password">Password</Label>
                      <Input id="su-password" type="password" required value={suPassword} onChange={(e) => setSuPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <RadioGroup value={role} onValueChange={(v) => setRole(v as AppRole)} className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 rounded-md border border-border p-3">
                          <RadioGroupItem value="customer" id="r-customer" />
                          <Label htmlFor="r-customer" className="cursor-pointer">Customer</Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border border-border p-3">
                          <RadioGroupItem value="chef" id="r-chef" />
                          <Label htmlFor="r-chef" className="cursor-pointer">Chef</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Button type="submit" disabled={busy} className="w-full">Create account</Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        <aside className="order-1 lg:order-2">
          <div className="rounded-xl border bg-card p-6">
            {tab === "signup" ? (
              <>
                <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Getting started</p>
                <h2 className="text-xl font-semibold mb-2">{role === "chef" ? "Become a Chef" : "For Customers"}</h2>
                <p className="text-muted-foreground mb-4">
                  {role === "chef"
                    ? "List your dishes, set your schedule, and get paid via Stripe Connect. You cook—we handle payments and support."
                    : "Create an account to explore menus from nearby home chefs, schedule orders, save favorites, and checkout securely."}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {role === "chef" ? (
                    <>
                      <li>Publish menu items and availability</li>
                      <li>Secure payouts with Stripe Connect</li>
                      <li>Simple onboarding—start earning</li>
                    </>
                  ) : (
                    <>
                      <li>Discover local chefs and menus</li>
                      <li>Book ahead and manage orders</li>
                      <li>Safe payments powered by Stripe</li>
                    </>
                  )}
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Homemade</p>
                <h2 className="text-xl font-semibold mb-2">Local chefs, cooked for you</h2>
                <p className="text-muted-foreground">Discover nearby home chefs, browse menus, and order safely with Stripe. Sign in to continue.</p>
              </>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Auth;
