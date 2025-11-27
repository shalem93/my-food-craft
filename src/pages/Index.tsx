import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import Hero from "@/components/site/Hero";
import ChefCard from "@/components/site/ChefCard";
import CartSheet from "@/components/site/CartSheet";
import { useChefs } from "@/hooks/useChefs";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
  return R * c;
}

const Index = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(15); // km
  const [geoDenied, setGeoDenied] = useState(false);

  const { user, loading, userRole } = useAuth();
  const { chefs, loading: chefsLoading } = useChefs();

  // Check for active order and redirect to tracking page
  useEffect(() => {
    const orderId = localStorage.getItem('current_order_id');
    const paymentIntentId = localStorage.getItem('current_payment_intent_id');
    
    if (orderId || paymentIntentId) {
      console.log('Found active order in localStorage, redirecting to tracking page');
      const params = orderId 
        ? `order_id=${orderId}` 
        : `payment_intent_id=${paymentIntentId}`;
      window.location.href = `/order-tracking?${params}`;
    }
  }, []);

  const sorted = useMemo(() => {
    if (!coords) return chefs;
    return [...chefs]
      .map((c) => ({
        ...c,
        _distance: c.lat && c.lng ? haversine(coords, { lat: c.lat, lng: c.lng }) : Infinity,
      }))
      .filter((c) => (c as any)._distance <= radius)
      .sort((a: any, b: any) => a._distance - b._distance);
  }, [coords, radius]);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoDenied(false);
      },
      () => setGeoDenied(true),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!loading && user && userRole === "chef") {
    return <Navigate to="/chef-dashboard" replace />;
  }

  return (
    <div>
      <Helmet>
        <title>Homemade — Order Homemade Food from Local Chefs</title>
        <meta name="description" content="Browse local chefs, explore menus, and order authentic homemade food delivered to your door." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://homemade.app"} />
        <meta property="og:title" content="Homemade — Order Homemade Food from Local Chefs" />
        <meta property="og:description" content="Browse local chefs, explore menus, and order authentic homemade food delivered to your door." />
      </Helmet>
      <HeaderNav />
      <main>
        <Hero />
        <section id="chefs" className="container mx-auto px-4 py-10">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Featured chefs</h2>
            <p className="text-sm text-muted-foreground">Handpicked kitchens near you</p>
          </div>

          <div className="mb-6 rounded-xl border bg-card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Find chefs near you</p>
              <p className="text-xs text-muted-foreground">Use your location and radius to filter results.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Button variant="secondary" onClick={useMyLocation}>Use my location</Button>
              <div className="w-full md:w-64">
                <p className="text-xs text-muted-foreground mb-1">Radius: {radius} km</p>
                <Slider value={[radius]} onValueChange={(v) => setRadius(v[0])} min={5} max={50} step={1} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chefsLoading ? (
              <p className="text-sm text-muted-foreground">Loading chefs...</p>
            ) : sorted.length === 0 ? (
              <div className="col-span-full">
                {coords ? (
                  <p className="text-sm text-muted-foreground">No chefs within {radius} km of your location.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No online chefs available at the moment.</p>
                )}
              </div>
            ) : (
              sorted.map((c: any) => (
                <ChefCard
                  key={c.id}
                  slug={c.user_id}
                  name={c.display_name}
                  rating={c.rating}
                  tasteRating={c.tasteRating}
                  looksRating={c.looksRating}
                  priceLevel={c.priceLevel}
                  deliveryEta={c.deliveryEta}
                  tags={c.tags}
                  image={c.image}
                />
              ))
            )}
            {geoDenied && !coords && (
              <p className="text-sm text-muted-foreground col-span-full">Location access denied. Showing all available chefs.</p>
            )}
          </div>
        </section>

        <section id="how-it-works" className="container mx-auto px-4 pb-16">
          <div className="rounded-2xl border bg-card p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold">How it works</h2>
            <ol className="mt-4 grid gap-4 md:grid-cols-3">
              <li className="rounded-xl bg-muted/50 p-4">
                <p className="font-medium">1. Browse local chefs</p>
                <p className="text-sm text-muted-foreground">Discover authentic homemade menus nearby.</p>
              </li>
              <li className="rounded-xl bg-muted/50 p-4">
                <p className="font-medium">2. Pick your favorites</p>
                <p className="text-sm text-muted-foreground">Add dishes to your cart and customize your order.</p>
              </li>
              <li className="rounded-xl bg-muted/50 p-4">
                <p className="font-medium">3. Enjoy at home</p>
                <p className="text-sm text-muted-foreground">Delivered hot and fresh straight to your door.</p>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <CartSheet />
    </div>
  );
};

export default Index;
