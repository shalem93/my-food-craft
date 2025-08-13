import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

type Props = {
  slug: string;
  name: string;
  rating: number;
  deliveryEta: string;
  tags: string[];
  image: string;
  tasteRating?: number;
  looksRating?: number;
  priceLevel?: number; // 1-4 like Yelp
};

const ChefCard = ({ slug, name, rating, deliveryEta, tags, image, tasteRating, looksRating, priceLevel }: Props) => {
  const adjective = rating >= 4.8 ? "Exceptional" : rating >= 4.5 ? "Excellent" : rating >= 4.2 ? "Great" : rating >= 3.8 ? "Good" : "New";
  const taste = typeof tasteRating === "number" ? tasteRating : Math.max(0, Math.min(5, rating - 0.1));
  const looks = typeof looksRating === "number" ? looksRating : Math.max(0, Math.min(5, rating - 0.3));
  const price = Math.max(1, Math.min(4, priceLevel ?? 2));
  const priceLabel = "$".repeat(price);
  return (
    <Card className="group overflow-hidden transition-transform will-change-transform hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={image} alt={`${name} portrait`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/0 to-transparent" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg leading-snug">{name}</h3>
            <p className="text-sm text-muted-foreground">{tags.join(" • ")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5">
                <span className="font-medium">Taste</span>
                <Star className="h-3 w-3 text-primary" aria-hidden="true" />
                <span className="text-foreground">{taste.toFixed(1)}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5">
                <span className="font-medium">Looks</span>
                <Star className="h-3 w-3 text-primary" aria-hidden="true" />
                <span className="text-foreground">{looks.toFixed(1)}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5">
                <span className="font-medium">Price</span>
                <span aria-label={`Price level ${price} of 4`} className="text-foreground">{priceLabel}</span>
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5">
                <Star className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              </span>
              <span aria-hidden="true">•</span>
              <span className="font-brandSerif italic">{adjective} ratings</span>
              <span aria-hidden="true">•</span>
              <span>{deliveryEta}</span>
            </div>
          </div>
          <Link to={`/chef/${slug}`} aria-label={`View ${name}'s menu`}>
            <Button size="sm">View menu</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChefCard;
