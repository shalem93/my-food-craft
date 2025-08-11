import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Props = {
  slug: string;
  name: string;
  rating: number;
  deliveryEta: string;
  tags: string[];
  image: string;
};

const ChefCard = ({ slug, name, rating, deliveryEta, tags, image }: Props) => {
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
            <p className="mt-1 text-sm text-muted-foreground">⭐ {rating.toFixed(1)} • {deliveryEta}</p>
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
