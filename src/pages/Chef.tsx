import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import MenuItemCard from "@/components/site/MenuItemCard";
import CartSheet from "@/components/site/CartSheet";
import { Badge } from "@/components/ui/badge";
import ReviewsSection from "@/components/site/ReviewsSection";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface Chef {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  city: string;
  rating: number;
  deliveryEta: string;
  tags: string[];
  image: string;
  banner: string;
  menu: MenuItem[];
}

const ChefPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [chef, setChef] = useState<Chef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChef = async () => {
      if (!slug) return;
      
      const { data: profile } = await supabase
        .from("chef_profiles")
        .select("*")
        .eq("user_id", slug)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("*")
        .eq("chef_user_id", slug)
        .eq("available", true);

      const { data: ratings } = await supabase
        .from("chef_ratings")
        .select("*")
        .eq("chef_user_id", slug)
        .single();

      const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("chef_user_id", slug);

      const tags = ["Homemade", profile.city || "Local"];
      
      setChef({
        id: profile.id,
        user_id: profile.user_id,
        display_name: profile.display_name || "Chef",
        bio: profile.bio || "",
        city: profile.city || "",
        rating: ratings?.avg_overall || 4.5,
        deliveryEta: "30-45 min",
        tags,
        image: profile.profile_image_url || "/placeholder.svg",
        banner: profile.banner_image_url || "/placeholder.svg",
        menu: (menuItems || []).map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: item.price ?? (item.price_cents / 100),
          image: item.image_url || "/placeholder.svg"
        }))
      });
      
      setLoading(false);
    };

    fetchChef();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Chef not found</p>
          <Link to="/" className="underline text-muted-foreground hover:text-foreground">Go back</Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: chef.display_name,
    url: typeof window !== "undefined" ? window.location.href : `https://homemade.app/chef/${chef.user_id}`,
    servesCuisine: chef.tags,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: chef.rating,
      reviewCount: 120,
    },
  };

  return (
    <div>
      <Helmet>
        <title>{`${chef.display_name} menu | Homemade`}</title>
        <meta name="description" content={`Order ${chef.display_name} on Homemade. ${chef.tags.join(", ")}. Delivery ${chef.deliveryEta}.`} />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : `https://homemade.app/chef/${chef.user_id}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <HeaderNav />
      <main className="pt-16">
        <section className="relative">
          {chef.banner && (
            <div className="relative h-56 md:h-72 w-full overflow-hidden">
              <img src={chef.banner} alt={`${chef.display_name} banner`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>
          )}
          <div className="container mx-auto px-4 -mt-10 md:-mt-14 relative">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <img src={chef.image} alt={`${chef.display_name} portrait`} className="h-16 w-16 rounded-md object-cover" />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{chef.display_name}</h1>
                  <p className="text-muted-foreground text-sm">⭐ {chef.rating.toFixed(1)} • {chef.deliveryEta} • {chef.city}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {chef.tags.map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chef.menu.map((item) => (
              <MenuItemCard key={item.id} chefSlug={chef.user_id} id={item.id} name={item.name} description={item.description} price={item.price} image={item.image} />
            ))}
          </div>

          <ReviewsSection chefSlug={chef.user_id} title="Customer reviews" showForm={false} />
        </section>
      </main>
      <CartSheet />
    </div>
  );
};

export default ChefPage;
