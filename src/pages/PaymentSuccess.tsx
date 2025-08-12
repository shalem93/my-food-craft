import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { loadStripe } from "@stripe/stripe-js";

const PaymentSuccess = () => {
  const { clear } = useCart();
  useEffect(() => {
    const finalize = async () => {
      try {
        // Attempt to create delivery using the payment intent id from URL
        const params = new URLSearchParams(window.location.search);
        const clientSecret = params.get("payment_intent_client_secret");
        if (clientSecret) {
          const stripe = await loadStripe((await supabase.functions.invoke("stripe-pk")).data.publishableKey);
          const pi = await stripe?.retrievePaymentIntent(clientSecret);
          const piId = pi?.paymentIntent?.id as string | undefined;
          if (piId) {
            await supabase.functions.invoke("doordash-create", { body: { payment_intent_id: piId, payment_intent_client_secret: clientSecret } });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        clear();
      }
    };
    finalize();
  }, [clear]);

  return (
    <div>
      <Helmet>
        <title>Payment Success | Homemade</title>
        <meta name="description" content="Your payment was successful. We’re arranging delivery now. Thanks for ordering with Homemade!" />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://homemade.app/payment-success"} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto px-4 py-16">
        <section className="max-w-xl mx-auto text-center space-y-3">
          <h1 className="text-2xl font-bold">Thanks! Your order is confirmed</h1>
          <p className="text-muted-foreground">We’ve emailed a receipt and are arranging delivery. Your chef will start preparing your order shortly.</p>
        </section>
      </main>
    </div>
  );
};

export default PaymentSuccess;
