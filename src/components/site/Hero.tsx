import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-homemade.jpg";

const Hero = () => {
  return (
    <section aria-label="Hero" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Homemade dishes on a cozy kitchen table"
          className="h-[48vh] md:h-[64vh] w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
      </div>
      <div className="relative container mx-auto px-4 flex items-end h-[48vh] md:h-[64vh] pb-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
            Order homemade food from talented local chefs
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground">
            Discover daily menus made with care in neighborhood kitchens. Fresh, authentic, and delivered fast.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="#chefs">
              <Button size="lg">Browse chefs</Button>
            </a>
            <a href="#how-it-works">
              <Button size="lg" variant="secondary">How it works</Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
