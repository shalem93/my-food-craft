import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";

const PaymentSuccess = () => {
  const { clear } = useCart();
  const [redirecting, setRedirecting] = useState(false);
  
  useEffect(() => {
    const finalize = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        let paymentIntentId = params.get("payment_intent");
        const clientSecret = params.get("payment_intent_client_secret");
        
        console.log("URL params:", { paymentIntentId, clientSecret });
        console.log("Full URL:", window.location.href);
        
        // If we have client secret, extract payment intent ID from it
        if (clientSecret && !paymentIntentId) {
          paymentIntentId = clientSecret.split('_secret_')[0];
          console.log("Extracted payment intent ID from client secret:", paymentIntentId);
        }
        
        if (paymentIntentId) {
          setRedirecting(true);
          
          const result = await supabase.functions.invoke("doordash-create", { 
            body: { payment_intent_id: paymentIntentId, payment_intent_client_secret: clientSecret } 
          });
          console.log("DoorDash create result:", result);
          
          // Navigate immediately
          window.location.href = `/order-tracking?payment_intent_id=${paymentIntentId}`;
        } else {
          console.error("No payment intent ID found in URL");
          // Fallback - redirect to home after a delay
          setTimeout(() => {
            window.location.href = "/";
          }, 3000);
        }
      } catch (e) {
        console.error("Payment finalization error:", e);
        // On error, still redirect to avoid being stuck
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
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

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {redirecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to order tracking...
              </>
            ) : (
              "Setting up your delivery..."
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PaymentSuccess;