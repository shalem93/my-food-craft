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

  useEffect(() => {
    // Redirect to order tracking after a short delay
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const clientSecret = params.get("payment_intent_client_secret");
      if (clientSecret) {
        // Extract order ID from the payment intent if available
        window.location.href = `/order-tracking${window.location.search}`;
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <Helmet>
        <title>Payment Success | Homemade</title>
        <meta name="description" content="Your payment was successful. We're arranging delivery now. Thanks for ordering with Homemade!" />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://homemade.app/payment-success"} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto px-4 py-16">
        <section className="max-w-xl mx-auto text-center space-y-6">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600">Payment Successful!</h1>
            <p className="text-muted-foreground">Your order has been confirmed and we're arranging delivery.</p>
          </div>
          
          <div className="bg-card border rounded-lg p-6 text-left space-y-3">
            <h2 className="font-semibold">What happens next?</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Your chef will start preparing your meal
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                We'll arrange pickup and delivery through DoorDash
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                You'll receive SMS updates on your delivery progress
              </li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Redirecting to order tracking in a few seconds...
          </p>
        </section>
      </main>
    </div>
  );
};

export default PaymentSuccess;