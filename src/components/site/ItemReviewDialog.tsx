import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ItemReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  itemId: string;
  itemName: string;
  chefSlug?: string;
}

const ItemReviewDialog = ({ open, onOpenChange, orderId, itemId, itemName, chefSlug }: ItemReviewDialogProps) => {
  const [taste, setTaste] = useState(0);
  const [looks, setLooks] = useState(0);
  const [price, setPrice] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!taste || !looks || !price) {
      toast.error("Please rate all categories");
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from('reviews').insert({
        user_id: userData.user.id,
        order_id: orderId,
        external_menu_item_id: itemId,
        external_chef_slug: chefSlug || null,
        taste,
        looks,
        price,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      onOpenChange(false);
      
      // Reset form
      setTaste(0);
      setLooks(0);
      setPrice(0);
      setComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const RatingStars = ({ rating, onRatingChange, label }: { rating: number; onRatingChange: (rating: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review {itemName}</DialogTitle>
          <DialogDescription>
            Share your experience with this dish
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <RatingStars rating={taste} onRatingChange={setTaste} label="Taste" />
          <RatingStars rating={looks} onRatingChange={setLooks} label="Presentation" />
          <RatingStars rating={price} onRatingChange={setPrice} label="Value for Money" />
          
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell us more about this dish..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemReviewDialog;
