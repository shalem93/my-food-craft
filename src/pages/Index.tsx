import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import Hero from "@/components/site/Hero";
import ChefCard from "@/components/site/ChefCard";
import CartSheet from "@/components/site/CartSheet";
import { chefs } from "@/data/chefs";

const Index = () => {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chefs.map((c) => (
              <ChefCard key={c.id} slug={c.slug} name={c.name} rating={c.rating} deliveryEta={c.deliveryEta} tags={c.tags} image={c.image} />
            ))}
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
