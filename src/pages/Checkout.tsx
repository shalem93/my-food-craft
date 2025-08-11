import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";

const PaymentForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/payment-success` },
    });
    if (error) {
      alert(error.message || "Payment failed");
      setSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button className="mt-2" disabled={!stripe || submitting} onClick={handlePay}>
        {submitting ? "Processing..." : "Place order"}
      </Button>
    </div>
  );
};

const Checkout = () => {
  const { items, total, clear } = useCart();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const amountCents = useMemo(() => Math.max(50, Math.round(total * 100)), [total]);

  useEffect(() => {
    const setup = async () => {
      if (items.length === 0) return;
      // 1) Get publishable key
      const { data: pkRes, error: pkErr } = await supabase.functions.invoke("stripe-pk");
      if (pkErr || !pkRes?.publishableKey) {
        console.error(pkErr || "Missing publishable key");
        return;
      }
      setStripePromise(loadStripe(pkRes.publishableKey));

      // 2) Create PaymentIntent for the cart total
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { amount: amountCents, currency: "usd" },
      });
      if (error || !data?.client_secret) {
        console.error(error || "No client secret returned");
        return;
      }
      setClientSecret(data.client_secret);
    };
    setup();
  }, [amountCents, items.length]);

  return (
    <div>
      <Helmet>
        <title>Checkout | Homemade</title>
        <meta name="description" content="Secure checkout on Homemade. Review your order and enter delivery details." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://homemade.app/checkout"} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Delivery details</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Jane Doe" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="(555) 123-4567" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main St" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="City" />
              </div>
              <div>
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" placeholder="00000" />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Payment</h2>
            {!stripePromise || !clientSecret ? (
              <p className="text-sm text-muted-foreground">Preparing secure payment...</p>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm onSuccess={() => clear()} />
              </Elements>
            )}
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-3">Order summary</h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in cart.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between">
                    <span className="text-sm">{i.name} × {i.quantity}</span>
                    <span className="text-sm font-medium">${(i.price * i.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-semibold">${(amountCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Checkout;
