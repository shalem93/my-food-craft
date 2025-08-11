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
        <title>Sign in or Sign up | homemade</title>
        <meta name="description" content="Sign in or create an account to order homemade food as a customer or chef." />
        <link rel="canonical" href={`${window.location.origin}/auth`} />
      </Helmet>

      <h1 className="sr-only">Sign in or Sign up</h1>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Welcome to homemade</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
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
    </main>
  );
};

export default Auth;
