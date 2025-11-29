import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";
const PaymentForm = ({ 
  onConfirmed, 
  orderId, 
  deliveryInfo 
}: { 
  onConfirmed: () => void;
  orderId: string | null;
  deliveryInfo: { fullName: string; phone: string; address: string; city: string; zip: string; deliveryFeeCents: number | null };
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) {
      console.log("Stripe or elements not ready");
      return;
    }
    
    console.log("Starting payment confirmation...");
    setSubmitting(true);
    
    try {
      // Save delivery info to order before payment
      if (orderId && deliveryInfo.address && deliveryInfo.phone) {
        const dropoff_address = `${deliveryInfo.address}, ${deliveryInfo.city} ${deliveryInfo.zip}`;
        await supabase
          .from("orders")
          .update({
            dropoff_address,
            dropoff_phone: deliveryInfo.phone,
            dropoff_business_name: deliveryInfo.fullName,
            delivery_fee_cents: deliveryInfo.deliveryFeeCents,
          })
          .eq("id", orderId);
        console.log("Delivery info saved to order before payment");
      }
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/payment-success` },
        redirect: "if_required"
      });
      
      console.log("Payment confirmation result:", { error, paymentIntent });
      
      if (error) {
        console.error("Payment error:", error);
        alert(error.message || "Payment failed");
        setSubmitting(false);
      } else if (paymentIntent) {
        console.log("Payment succeeded, redirecting with payment intent:", paymentIntent.id);
        // Payment succeeded, redirect to success page with payment intent ID
        window.location.href = `${window.location.origin}/payment-success?payment_intent=${paymentIntent.id}`;
      } else {
        console.log("No error but no payment intent - this shouldn't happen");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Unexpected error during payment:", err);
      alert("An unexpected error occurred");
      setSubmitting(false);
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [chefInfo, setChefInfo] = useState<{ name: string; city: string; zip: string } | null>(null);

  // Delivery form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [deliveryFeeCents, setDeliveryFeeCents] = useState<number | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const amountCents = useMemo(() => Math.max(50, Math.round(total * 100)), [total]);

  // Load chef info for display
  useEffect(() => {
    const loadChefInfo = async () => {
      // For now using the demo chef ID - in future this would come from cart items
      const { data } = await supabase
        .from("chef_profiles")
        .select("display_name, city, zip")
        .eq("user_id", "89a542ee-b062-46c5-b3be-631e8cdcd939")
        .maybeSingle();
      
      if (data) {
        setChefInfo({
          name: data.display_name || "Chef",
          city: data.city || "",
          zip: data.zip || ""
        });
      }
    };
    loadChefInfo();
  }, []);

  // Load saved addresses for authenticated users
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!user) return;
      
      setIsLoadingAddresses(true);
      const { data, error } = await supabase
        .from("saved_addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error loading addresses:", error);
      } else {
        setSavedAddresses(data || []);
          // Auto-select default address
          const defaultAddress = data?.find(addr => addr.is_default);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setFullName(defaultAddress.full_name);
            setPhone(defaultAddress.phone);
            setAddress(defaultAddress.address);
            setCity(defaultAddress.city);
            setZip(defaultAddress.zip);
            // Auto-request quote for default address with immediate values
            requestQuote(
              defaultAddress.phone,
              defaultAddress.address,
              defaultAddress.city,
              defaultAddress.zip,
              defaultAddress.full_name
            );
          }
      }
      setIsLoadingAddresses(false);
    };

    loadSavedAddresses();
  }, [user]);

  useEffect(() => {
    const setup = async () => {
      if (items.length === 0) return;
      const { data: pkRes, error: pkErr } = await supabase.functions.invoke("stripe-pk");
      if (pkErr || !pkRes?.publishableKey) {
        console.error(pkErr || "Missing publishable key");
        return;
      }
      setStripePromise(loadStripe(pkRes.publishableKey));

      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { 
          amount: amountCents, 
          currency: "usd",
          chef_user_id: "89a542ee-b062-46c5-b3be-631e8cdcd939", // Demo chef with pickup address
          items: items.map(item => {
            // Only include menu_item_id if it's a valid UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
            return {
              ...(isUUID ? { menu_item_id: item.id } : {}),
              name: item.name,
              price_cents: Math.round(item.price * 100),
              quantity: item.quantity,
            };
          }),
        },
      });
      if (error || !data?.client_secret) {
        console.error(error || "No client secret returned");
        return;
      }
      setClientSecret(data.client_secret);
      if (data.order_id) setOrderId(data.order_id);
    };
    setup();
  }, [amountCents, items.length]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setFullName(selectedAddress.full_name);
      setPhone(selectedAddress.phone);
      setAddress(selectedAddress.address);
      setCity(selectedAddress.city);
      setZip(selectedAddress.zip);
      // Request quote immediately with the new address values
      requestQuote(
        selectedAddress.phone,
        selectedAddress.address,
        selectedAddress.city,
        selectedAddress.zip,
        selectedAddress.full_name
      );
    }
  };

  const saveCurrentAddress = async () => {
    if (!user || !fullName || !phone || !address || !city || !zip) return;
    
    const { error } = await supabase.from("saved_addresses").insert({
      user_id: user.id,
      label: "New Address",
      full_name: fullName,
      phone,
      address,
      city,
      zip,
      is_default: savedAddresses.length === 0 // First address becomes default
    });
    
    if (!error) {
      // Reload addresses
      const { data } = await supabase
        .from("saved_addresses")
        .select("*")
        .order("is_default", { ascending: false });
      setSavedAddresses(data || []);
    }
  };

  const requestQuote = async (
    phoneParam?: string,
    addressParam?: string,
    cityParam?: string,
    zipParam?: string,
    fullNameParam?: string
  ) => {
    const phoneVal = phoneParam || phone;
    const addressVal = addressParam || address;
    const cityVal = cityParam || city;
    const zipVal = zipParam || zip;
    const fullNameVal = fullNameParam || fullName;

    if (!phoneVal || !addressVal || !cityVal || !zipVal) return;
    const dropoff_address = `${addressVal}, ${cityVal} ${zipVal}`;
    
    try {
      // Fetch chef pickup address for demo chef
      const { data: chefProfile } = await supabase
        .from("chef_profiles")
        .select("pickup_address, city, zip")
        .eq("user_id", "89a542ee-b062-46c5-b3be-631e8cdcd939")
        .maybeSingle();
      
      if (!chefProfile?.pickup_address || !chefProfile?.city || !chefProfile?.zip) {
        console.log("Chef pickup address not found");
        return;
      }

      const pickup_address = `${chefProfile.pickup_address}, ${chefProfile.city} ${chefProfile.zip}`;

      const { data, error } = await supabase.functions.invoke("doordash-quote", {
        body: { 
          dropoff_address, 
          dropoff_phone: phoneVal,
          pickup_address,
        },
      });
      
      if (error) {
        // Use console.log instead of console.error to avoid triggering error handlers
        console.log("Delivery quote error (expected for distant addresses):", data?.message || error.message);
        const errorMessage = data?.message || "Could not get delivery quote. Please try again.";
        setDeliveryError(errorMessage);
        setDeliveryFeeCents(null);
        return;
      }
      
      // Clear any previous error and set the delivery fee
      setDeliveryError(null);
      if (data?.delivery_fee_cents) {
        setDeliveryFeeCents(data.delivery_fee_cents);
        if (orderId) {
          const updateResult = await (supabase as any)
            .from("orders")
            .update({
              dropoff_address,
              dropoff_phone: phoneVal,
              dropoff_business_name: fullNameVal,
              delivery_fee_cents: data.delivery_fee_cents,
            })
            .eq("id", orderId);
          console.log("Order update result:", updateResult);
        }
      }
    } catch (err) {
      // Silently handle any unexpected errors - just show inline message
      console.log("Delivery quote request failed:", err);
      setDeliveryError("Could not get delivery quote. Please try again.");
      setDeliveryFeeCents(null);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Checkout | Homemade</title>
        <meta name="description" content="Secure checkout on Homemade. Review your order and enter delivery details with delivery estimates." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://homemade.app/checkout"} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          {/* Chef / Pickup Location Info */}
          {chefInfo && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Ordering from</p>
              <p className="font-semibold text-lg">{chefInfo.name}</p>
              {(chefInfo.city || chefInfo.zip) && (
                <p className="text-sm text-muted-foreground">
                  Pickup area: {[chefInfo.city, chefInfo.zip].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Delivery details</h1>
            
            {/* Saved Addresses Dropdown for Logged In Users */}
            {user && !isLoadingAddresses && (
              <div className="space-y-2">
                <Label>Delivery Address</Label>
                {savedAddresses.length > 0 ? (
                  <>
                    <Select value={selectedAddressId} onValueChange={handleAddressSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a saved address" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedAddresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{addr.label}</span>
                              <span className="text-sm text-muted-foreground">
                                {addr.address}, {addr.city} {addr.zip}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="new">+ Add new address</SelectItem>
                      </SelectContent>
                    </Select>
                    {deliveryError && (
                      <p className="text-sm text-destructive mt-1">
                        {deliveryError}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No saved addresses. Fill out the form below to create one.</p>
                )}
              </div>
            )}

            {/* Address Form */}
            {(!user || selectedAddressId === "new" || savedAddresses.length === 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP</Label>
                  <Input id="zip" placeholder="00000" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
                {user && (
                  <div className="md:col-span-2">
                    <Button variant="outline" onClick={saveCurrentAddress} disabled={!fullName || !phone || !address || !city || !zip}>
                      Save this address
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Manual delivery estimate button (only if no auto-trigger) */}
            {deliveryFeeCents === null && (
              <div>
                <Button variant="secondary" onClick={() => requestQuote()} disabled={!phone || !address || !city || !zip}>
                  Get delivery estimate
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Payment</h2>
            {!stripePromise || !clientSecret ? (
              <p className="text-sm text-muted-foreground">Preparing secure payment...</p>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  onConfirmed={() => clear()} 
                  orderId={orderId}
                  deliveryInfo={{ fullName, phone, address, city, zip, deliveryFeeCents }}
                />
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
            {deliveryFeeCents !== null && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Delivery</span>
                <span className="font-semibold">${(deliveryFeeCents / 100).toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-semibold">${(((amountCents + (deliveryFeeCents ?? 0)) / 100)).toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Checkout;
