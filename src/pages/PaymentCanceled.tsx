import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";

const PaymentCanceled = () => {
  return (
    <div>
      <Helmet>
        <title>Payment Canceled | Homemade</title>
        <meta name="description" content="Your payment was canceled. You can review your cart and try again." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://homemade.app/payment-canceled"} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto px-4 py-16">
        <section className="max-w-xl mx-auto text-center space-y-3">
          <h1 className="text-2xl font-bold">Payment canceled</h1>
          <p className="text-muted-foreground">No worries — your cart is saved. You can resume checkout anytime.</p>
        </section>
      </main>
    </div>
  );
};

export default PaymentCanceled;
