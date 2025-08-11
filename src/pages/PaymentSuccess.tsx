import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

const PaymentSuccess = () => {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div>
      <Helmet>
        <title>Payment Success | Homemade</title>
        <meta name="description" content="Your payment was successful. Thanks for ordering with Homemade!" />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://homemade.app/payment-success"} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto px-4 py-16">
        <section className="max-w-xl mx-auto text-center space-y-3">
          <h1 className="text-2xl font-bold">Thanks! Your order is confirmed</h1>
          <p className="text-muted-foreground">We’ve emailed a receipt. Your chef will start preparing your order shortly.</p>
        </section>
      </main>
    </div>
  );
};

export default PaymentSuccess;
