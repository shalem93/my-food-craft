import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface ReviewsSectionProps {
  chefSlug: string;
  itemId?: string; // when provided, show dish-specific reviews
  title?: string;
}

export default function ReviewsSection({ chefSlug, itemId, title }: ReviewsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  const [taste, setTaste] = useState("5");
  const [looks, setLooks] = useState("5");
  const [price, setPrice] = useState("5");
  const [comment, setComment] = useState("");

  useEffect(() => {
    let active = true;
    const fetchReviews = async () => {
      setLoading(true);
      const query = supabase
        .from("reviews")
        .select("id, comment, taste, looks, price, created_at, user_id")
        .eq("external_chef_slug", chefSlug)
        .order("created_at", { ascending: false })
        .limit(50);

      const { data, error } = itemId
        ? await query.eq("external_menu_item_id", itemId)
        : await query.is("external_menu_item_id", null);

      if (!active) return;
      if (error) {
        toast({ title: "Could not load reviews", description: error.message, variant: "destructive" });
      } else {
        setReviews(data || []);
      }
      setLoading(false);
    };
    fetchReviews();
    return () => { active = false; };
  }, [chefSlug, itemId]);

  const averages = useMemo(() => {
    if (!reviews.length) return { taste: 0, looks: 0, price: 0, count: 0 };
    const sum = reviews.reduce(
      (acc, r) => ({ taste: acc.taste + r.taste, looks: acc.looks + r.looks, price: acc.price + r.price }),
      { taste: 0, looks: 0, price: 0 }
    );
    return {
      taste: sum.taste / reviews.length,
      looks: sum.looks / reviews.length,
      price: sum.price / reviews.length,
      count: reviews.length,
    };
  }, [reviews]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please sign in to review" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      chef_user_id: null, // demo chefs not mapped to auth users
      taste: Number(taste),
      looks: Number(looks),
      price: Number(price),
      comment: comment.trim() || null,
      external_chef_slug: chefSlug,
      external_menu_item_id: itemId ?? null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit review", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Thanks for your review!" });
    setComment("");
    setTaste("5");
    setLooks("5");
    setPrice("5");
    // refresh
    const { data } = await supabase
      .from("reviews")
      .select("id, comment, taste, looks, price, created_at, user_id")
      .eq("external_chef_slug", chefSlug)
      .eq("external_menu_item_id", itemId ?? null)
      .order("created_at", { ascending: false })
      .limit(50);
    setReviews(data || []);
  };

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl font-semibold">{title ?? (itemId ? "Dish reviews" : "Customer reviews")}</h2>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : reviews.length ? `${averages.taste.toFixed(1)} taste • ${averages.looks.toFixed(1)} looks • ${averages.price.toFixed(1)} price (${averages.count})` : "No reviews yet"}
        </p>
      </div>

      {user && (
        <form onSubmit={onSubmit} className="rounded-xl border p-4 grid gap-4 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">Taste</Label>
              <RadioGroup value={taste} onValueChange={setTaste} className="flex gap-2">
                {[1,2,3,4,5].map((n) => (
                  <div key={`t-${n}`} className="flex items-center gap-2">
                    <RadioGroupItem id={`taste-${n}`} value={String(n)} />
                    <Label htmlFor={`taste-${n}`}>{n}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="mb-2 block">Looks</Label>
              <RadioGroup value={looks} onValueChange={setLooks} className="flex gap-2">
                {[1,2,3,4,5].map((n) => (
                  <div key={`l-${n}`} className="flex items-center gap-2">
                    <RadioGroupItem id={`looks-${n}`} value={String(n)} />
                    <Label htmlFor={`looks-${n}`}>{n}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="mb-2 block">Price</Label>
              <RadioGroup value={price} onValueChange={setPrice} className="flex gap-2">
                {[1,2,3,4,5].map((n) => (
                  <div key={`p-${n}`} className="flex items-center gap-2">
                    <RadioGroupItem id={`price-${n}`} value={String(n)} />
                    <Label htmlFor={`price-${n}`}>{n}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <div>
            <Label htmlFor="comment">Comments (optional)</Label>
            <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share details about taste, presentation, and value…" rows={3} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit review"}</Button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border p-4 bg-card">
            <p className="text-sm text-muted-foreground">Taste {r.taste} • Looks {r.looks} • Price {r.price}</p>
            {r.comment && (
              <p className="mt-1 text-sm">{r.comment}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
