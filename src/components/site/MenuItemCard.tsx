import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";

interface Props {
  chefSlug: string;
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

const MenuItemCard = ({ chefSlug, id, name, description, price, image }: Props) => {
  const { add } = useCart();
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={image} alt={name} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="font-medium leading-snug">{name}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            <p className="mt-1 text-sm font-semibold">${price.toFixed(2)}</p>
          </div>
          <Button size="sm" onClick={() => add({ id, name, price, image, chefSlug })}>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
