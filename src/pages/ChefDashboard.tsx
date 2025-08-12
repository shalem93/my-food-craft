import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";

// Local types to avoid depending on generated Supabase types
interface MenuItemRow {
  id: string;
  chef_user_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  available: boolean;
  created_at: string;
}

interface ReviewRow {
  id: string;
  chef_user_id: string;
  user_id: string;
  order_id: string | null;
  taste: number;
  looks: number;
  price: number;
  comment: string | null;
  created_at: string;
}

interface RatingsAgg {
  chef_user_id: string;
  review_count: number;
  avg_taste: number;
  avg_looks: number;
  avg_price: number;
  avg_overall: number;
}

const ChefDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const [menuLoading, setMenuLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);

  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [agg, setAgg] = useState<RatingsAgg | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    available: true,
  });

  const { toast } = useToast();

  const refreshStatus = async () => {
    const { data, error } = await supabase.functions.invoke("connect-check-status");
    if (!error) setStatus(data);
  };

  useEffect(() => {
    refreshStatus();
    // Load menu and reviews for the current user
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      // Menu
      setMenuLoading(true);
      const { data: items, error: menuErr } = await (supabase as any)
        .from("menu_items")
        .select("*")
        .eq("chef_user_id", uid)
        .order("created_at", { ascending: false });
      if (!menuErr) setMenuItems(items as MenuItemRow[]);
      setMenuLoading(false);

      // Reviews aggregate
      setReviewsLoading(true);
      const { data: aggData } = await (supabase as any)
        .from("chef_ratings")
        .select("*")
        .eq("chef_user_id", uid)
        .maybeSingle();
      setAgg((aggData || null) as RatingsAgg | null);

      // Reviews list
      const { data: revs } = await (supabase as any)
        .from("reviews")
        .select("*")
        .eq("chef_user_id", uid)
        .order("created_at", { ascending: false });
      setReviews((revs || []) as ReviewRow[]);
      setReviewsLoading(false);
    })();
  }, []);

  const startOnboarding = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("connect-create-account");
    setLoading(false);
    if (error) return alert(error.message || "Error starting onboarding");
    if (data?.url) window.open(data.url, "_blank");
  };

  const dollars = (cents: number) => (cents / 100).toFixed(2);

  const handleCreateItem = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const price_cents = Math.round(Number(form.price || 0) * 100);
    if (!form.name || isNaN(price_cents)) {
      toast({ description: "Please provide a name and valid price.", variant: "destructive" });
      return;
    }

    const { data, error } = await (supabase as any)
      .from("menu_items")
      .insert({
        chef_user_id: uid,
        name: form.name,
        description: form.description || null,
        price_cents,
        image_url: form.image_url || null,
        available: form.available,
      })
      .select("*")
      .single();

    if (error) {
      toast({ description: error.message, variant: "destructive" });
      return;
    }

    setMenuItems((prev) => [data as MenuItemRow, ...prev]);
    setOpenDialog(false);
    setForm({ name: "", description: "", price: "", image_url: "", available: true });
    toast({ description: "Menu item created." });
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await (supabase as any).from("menu_items").delete().eq("id", id);
    if (error) return toast({ description: error.message, variant: "destructive" });
    setMenuItems((prev) => prev.filter((i) => i.id !== id));
    toast({ description: "Menu item deleted." });
  };

  const toggleAvailability = async (item: MenuItemRow) => {
    const { data, error } = await (supabase as any)
      .from("menu_items")
      .update({ available: !item.available })
      .eq("id", item.id)
      .select("*")
      .single();
    if (error) return toast({ description: error.message, variant: "destructive" });
    setMenuItems((prev) => prev.map((i) => (i.id === item.id ? (data as MenuItemRow) : i)));
  };

  const ratingPill = (label: string, val?: number) => (
    <div className="rounded-full bg-muted px-3 py-1 text-sm">
      {label}: {val ? val.toFixed(1) : "–"}
    </div>
  );

  return (
    <div>
      <Helmet>
        <title>Chef Dashboard | Homemade</title>
        <meta name="description" content="Manage payouts, your menu, and see detailed reviews on Homemade." />
        <link
          rel="canonical"
          href={typeof window !== "undefined" ? window.location.href : "https://homemade.app/chef-dashboard"}
        />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto px-4 py-12">
        <section className="mx-auto max-w-5xl space-y-6">
          <h1 className="text-2xl font-bold">Chef dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Connect payouts, manage your dishes, and track multi-criteria reviews (taste, looks, price).
          </p>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div>
                  <p className="font-medium">Payouts via Stripe Connect</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {status ? (status.onboarding_complete ? "Onboarding complete" : "Action required") : "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={startOnboarding} disabled={loading}>
                    {loading ? "Redirecting..." : status?.onboarding_complete ? "Manage account" : "Set up payouts"}
                  </Button>
                  <Button variant="secondary" onClick={refreshStatus}>Refresh status</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="menu">
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">Your menu items</p>
                  <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Add item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add a new dish</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="desc">Description</Label>
                          <Textarea id="desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price (USD)</Label>
                          <Input id="price" type="number" inputMode="decimal" placeholder="12.50" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="image">Image URL</Label>
                          <Input id="image" placeholder="https://..." value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch id="available" checked={form.available} onCheckedChange={(val) => setForm((f) => ({ ...f, available: val }))} />
                          <Label htmlFor="available">Available</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateItem}>Create</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dish</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead className="w-14" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuLoading ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading menu...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : menuItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-muted-foreground">No items yet.</TableCell>
                        </TableRow>
                      ) : (
                        menuItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {item.image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.image_url} alt={item.name} className="h-10 w-14 rounded object-cover" loading="lazy" />
                                ) : (
                                  <div className="h-10 w-14 rounded bg-muted" />
                                )}
                                <div>
                                  <div className="font-medium leading-tight">{item.name}</div>
                                  <div className="md:hidden text-sm text-muted-foreground line-clamp-1">{item.description}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {item.description}
                            </TableCell>
                            <TableCell>${dollars(item.price_cents)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch checked={item.available} onCheckedChange={() => toggleAvailability(item)} />
                                <span className="text-sm text-muted-foreground">{item.available ? "On" : "Off"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium mr-2">Averages</div>
                    {ratingPill("Overall", agg?.avg_overall)}
                    {ratingPill("Taste", agg?.avg_taste)}
                    {ratingPill("Looks", agg?.avg_looks)}
                    {ratingPill("Price", agg?.avg_price)}
                    <div className="ml-auto text-sm text-muted-foreground">{agg?.review_count || 0} reviews</div>
                  </div>
                </div>

                <div className="rounded-xl border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Taste</TableHead>
                        <TableHead>Looks</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden md:table-cell">Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviewsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : reviews.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-muted-foreground">No reviews yet.</TableCell>
                        </TableRow>
                      ) : (
                        reviews.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{r.taste}/5</TableCell>
                            <TableCell>{r.looks}/5</TableCell>
                            <TableCell>{r.price}/5</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{r.comment}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <p className="text-xs text-muted-foreground">
                  Reviews use a 1–5 scale for taste, looks, and price. Optionally, we can restrict reviews to completed orders for extra integrity.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default ChefDashboard;
