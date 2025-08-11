import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

const CartSheet = () => {
  const { items, remove, update, total, count, clear } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="lg" className="fixed bottom-6 right-6 shadow-[var(--shadow-elevate)]" aria-label="Open cart">
          Cart ({count})
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] p-0 sm:p-0">
        <div className="p-6">
          <SheetHeader>
            <SheetTitle>Your order</SheetTitle>
          </SheetHeader>
        </div>
        <Separator />
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {items.length === 0 && (
            <p className="text-muted-foreground text-sm">Your cart is empty.</p>
          )}
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3">
              {i.image && (
                <img src={i.image} alt={i.name} className="h-14 w-14 rounded-md object-cover" loading="lazy" />
              )}
              <div className="flex-1">
                <p className="font-medium leading-tight">{i.name}</p>
                <p className="text-sm text-muted-foreground">${(i.price * i.quantity).toFixed(2)}</p>
                <div className="mt-2 inline-flex items-center gap-2">
                  <Button variant="secondary" size="icon" onClick={() => update(i.id, Math.max(1, i.quantity - 1))} aria-label="Decrease quantity">-</Button>
                  <span className="text-sm tabular-nums min-w-[1.5rem] text-center">{i.quantity}</span>
                  <Button variant="secondary" size="icon" onClick={() => update(i.id, i.quantity + 1)} aria-label="Increase quantity">+</Button>
                </div>
              </div>
              <Button variant="ghost" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`}>Remove</Button>
            </div>
          ))}
        </div>
        <Separator />
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p className="text-lg font-semibold">${total.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={clear}>Clear</Button>
            <Link to="/checkout">
              <Button disabled={items.length === 0}>Checkout</Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
