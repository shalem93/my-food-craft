import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import ReviewsSection from "./ReviewsSection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chefSlug: string;
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

const defaultAddOns = [
  "Tomato",
  "Onion",
  "Extra cheese",
  "Spicy",
];

export default function MenuItemDialog({ open, onOpenChange, chefSlug, id, name, description, price, image }: Props) {
  const { add } = useCart();
  const [selected, setSelected] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const toggle = (opt: string, checked: boolean) => {
    setSelected((prev) => checked ? [...prev, opt] : prev.filter((o) => o !== opt));
  };

  const addToCart = () => {
    add({ id, name, price, image, chefSlug, options: selected, note }, qty);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="relative">
            <img src={image} alt={name} className="h-full w-full object-cover" />
          </div>
          <div className="p-5">
            <DialogHeader>
              <DialogTitle className="text-xl">{name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="mt-2 font-semibold">${price.toFixed(2)}</p>

            <Separator className="my-4" />

            <div className="space-y-3">
              <p className="font-medium">Add-ons</p>
              <div className="grid grid-cols-2 gap-3">
                {defaultAddOns.map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selected.includes(opt)}
                      onCheckedChange={(v) => toggle(opt, Boolean(v))}
                      aria-label={opt}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="note">Note for the chef</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., No onions please, extra spicy…" rows={3} />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <Button variant="secondary" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">-</Button>
                <span className="min-w-[2rem] text-center">{qty}</span>
                <Button variant="secondary" size="icon" onClick={() => setQty((q) => q + 1)} aria-label="Increase">+</Button>
              </div>
              <Button onClick={addToCart} aria-label="Add to cart">
                Add to cart • ${(price * qty).toFixed(2)}
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews for this dish */}
        <div className="p-5">
          <ReviewsSection chefSlug={chefSlug} itemId={id} title="Reviews for this dish" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
