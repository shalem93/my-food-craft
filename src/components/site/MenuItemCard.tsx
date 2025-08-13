import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import MenuItemDialog from "./MenuItemDialog";

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
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button className="relative aspect-[16/10] overflow-hidden w-full" onClick={() => setOpen(true)} aria-label={`Customize ${name}`}>
        <img src={image} alt={name} className="h-full w-full object-cover" loading="lazy" />
      </button>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="font-medium leading-snug">{name}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            <p className="mt-1 text-sm font-semibold">${price.toFixed(2)}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Customize</Button>
            <Button size="sm" onClick={() => add({ id, name, price, image, chefSlug })}>Add</Button>
          </div>
        </div>
      </CardContent>
      <MenuItemDialog
        open={open}
        onOpenChange={setOpen}
        chefSlug={chefSlug}
        id={id}
        name={name}
        description={description}
        price={price}
        image={image}
      />
    </Card>
  );
};

export default MenuItemCard;
