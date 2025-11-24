import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import MenuItemCard from "@/components/site/MenuItemCard";
import CartSheet from "@/components/site/CartSheet";
import { getChefBySlug } from "@/data/chefs";
import { Badge } from "@/components/ui/badge";
import ReviewsSection from "@/components/site/ReviewsSection";

const ChefPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const chef = getChefBySlug(slug || "");

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
    name: chef.name,
    url: typeof window !== "undefined" ? window.location.href : `https://homemade.app/chef/${chef.slug}`,
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
        <title>{`${chef.name} menu | Homemade`}</title>
        <meta name="description" content={`Order ${chef.name} on Homemade. ${chef.tags.join(", ")}. Delivery ${chef.deliveryEta}.`} />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : `https://homemade.app/chef/${chef.slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <HeaderNav />
      <main className="pt-4">
        <section className="relative">
          {chef.banner && (
            <div className="relative h-56 md:h-72 w-full overflow-hidden">
              <img src={chef.banner} alt={`${chef.name} banner`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>
          )}
          <div className="container mx-auto px-4 -mt-10 md:-mt-14 relative">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <img src={chef.image} alt={`${chef.name} portrait`} className="h-16 w-16 rounded-md object-cover" />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{chef.name}</h1>
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
              <MenuItemCard key={item.id} chefSlug={chef.slug} id={item.id} name={item.name} description={item.description} price={item.price} image={item.image} />
            ))}
          </div>

          <ReviewsSection chefSlug={chef.slug} title="Customer reviews" />
        </section>
      </main>
      <CartSheet />
    </div>
  );
};

export default ChefPage;
