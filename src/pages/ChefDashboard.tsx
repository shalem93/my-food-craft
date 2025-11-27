import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Clock, Package, MapPin } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [chefProfile, setChefProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    pickup_address: "",
    pickup_phone: "",
    pickup_business_name: "",
    city: "",
    zip: "",
    display_name: "",
    bio: "",
    lat: null as number | null,
    lng: null as number | null
  });

  // Handle URL hash to set active tab
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash === 'menu' || hash === 'orders') {
      setActiveTab(hash);
    } else {
      setActiveTab('overview');
    }
  }, [location.hash]);

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  const [isOnline, setIsOnline] = useState(false);
  const [schedule, setSchedule] = useState<any>({
    monday: { open: "09:00", close: "21:00", enabled: true },
    tuesday: { open: "09:00", close: "21:00", enabled: true },
    wednesday: { open: "09:00", close: "21:00", enabled: true },
    thursday: { open: "09:00", close: "21:00", enabled: true },
    friday: { open: "09:00", close: "21:00", enabled: true },
    saturday: { open: "09:00", close: "21:00", enabled: true },
    sunday: { open: "09:00", close: "21:00", enabled: true }
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [earnings, setEarnings] = useState<{ date: string; total_cents: number }[]>([]);
  const [metrics, setMetrics] = useState<{
    totalEarningsCents: number;
    orderCount: number;
    avgOrderValueCents: number;
    currency: string;
  } | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const { toast } = useToast();

  const refreshStatus = async () => {
    const { data, error } = await supabase.functions.invoke("connect-check-status");
    if (!error && data) {
      setStatus(data);
    }
  };

  useEffect(() => {
    refreshStatus();
    // Load menu and reviews for the current user
    (async () => {
      setProfileLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        setProfileLoading(false);
        return;
      }

      // Load chef profile
      const { data: profile, error: profileError } = await supabase
        .from("chef_profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      
      if (profileError) {
        console.error("Error loading chef profile:", profileError);
        toast({
          title: "Error loading profile",
          description: profileError.message,
          variant: "destructive",
        });
      }
      
      console.log("Loaded chef profile:", profile);
      setChefProfile(profile);
      if (profile) {
      setAddressForm({
        pickup_address: profile.pickup_address || "",
        pickup_phone: profile.pickup_phone || "",
        pickup_business_name: profile.pickup_business_name || "",
        city: profile.city || "",
        zip: profile.zip || "",
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        lat: profile.lat,
        lng: profile.lng
      });
        setIsOnline(profile.is_online || false);
        setSchedule(profile.schedule || schedule);
        setShowAddressForm(false); // Hide form if profile exists
      } else {
        setShowAddressForm(true); // Show form if no profile
      }
      setProfileLoading(false);

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

  useEffect(() => {
    (async () => {
      setAnalyticsLoading(true);
      const { data, error } = await supabase.functions.invoke("chef-analytics");
      if (!error && data) {
        setMetrics(data.metrics);
        setEarnings(data.earnings);
        setRecentOrders(data.recentOrders || []);
      }
      setAnalyticsLoading(false);
    })();
  }, []);

  // Load live orders for the chef
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      setOrdersLoading(true);
      
      // Fetch orders for this chef
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('chef_user_id', uid)
        .in('delivery_status', ['created', 'confirmed', 'pickup', 'pickup_complete', 'dropoff', 'in_progress'])
        .order('created_at', { ascending: false });

      if (!error && orders) {
        setLiveOrders(orders);
      }
      setOrdersLoading(false);

      // Subscribe to real-time updates
      const channel = supabase
        .channel('chef-orders-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `chef_user_id=eq.${uid}`
          },
          (payload) => {
            console.log('Order update:', payload);
            if (payload.eventType === 'INSERT') {
              setLiveOrders(prev => [payload.new as any, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setLiveOrders(prev => prev.map(order => 
                order.id === payload.new.id ? { ...order, ...payload.new } : order
              ));
            } else if (payload.eventType === 'DELETE') {
              setLiveOrders(prev => prev.filter(order => order.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, []);

  const startOnboarding = async () => {
    try {
      console.log("Starting Stripe onboarding...");
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("connect-create-account");
      console.log("Stripe onboarding response:", { data, error });
      setLoading(false);
      
      if (error) {
        console.error("Stripe onboarding error:", error);
        toast({
          title: "Error",
          description: error.message || "Error starting onboarding",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.url) {
        console.log("Redirecting to:", data.url);
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "No redirect URL received from Stripe",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error("Exception in startOnboarding:", err);
      setLoading(false);
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const dollars = (cents: number) => (cents / 100).toFixed(2);

  const handleSaveAddress = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    if (!addressForm.pickup_address || !addressForm.pickup_phone || !addressForm.pickup_business_name) {
      toast({ description: "Please fill in all required address fields.", variant: "destructive" });
      return;
    }

    const profileData = {
      user_id: uid,
      pickup_address: addressForm.pickup_address,
      pickup_phone: addressForm.pickup_phone,
      pickup_business_name: addressForm.pickup_business_name,
      city: addressForm.city,
      zip: addressForm.zip,
      display_name: addressForm.display_name,
      bio: addressForm.bio,
      lat: addressForm.lat,
      lng: addressForm.lng
    };

    let error;
    if (chefProfile) {
      const { error: updateError } = await supabase
        .from("chef_profiles")
        .update(profileData)
        .eq("user_id", uid);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("chef_profiles")
        .insert(profileData);
      error = insertError;
    }

    if (error) {
      toast({ description: error.message, variant: "destructive" });
      return;
    }

    // Refresh profile
    const { data: profile } = await supabase
      .from("chef_profiles")
      .select("*")
      .eq("user_id", uid)
      .single();
    
    setChefProfile(profile);
    setShowAddressForm(false);
    toast({ description: "Chef profile updated successfully!" });
  };

  const toggleOnlineStatus = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const newStatus = !isOnline;
    const { error } = await supabase
      .from("chef_profiles")
      .update({ is_online: newStatus })
      .eq("user_id", uid);

    if (error) {
      toast({ description: error.message, variant: "destructive" });
      return;
    }

    setIsOnline(newStatus);
    toast({ 
      description: newStatus ? "You're now online and available for orders!" : "You're now offline" 
    });
  };

  const updateSchedule = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const { error } = await supabase
      .from("chef_profiles")
      .update({ schedule })
      .eq("user_id", uid);

    if (error) {
      toast({ description: error.message, variant: "destructive" });
      return;
    }

    toast({ description: "Schedule updated successfully!" });
  };

  const handleImageUpload = async (file: File) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return null;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uid}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('menu-items')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-items')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({ description: error.message, variant: "destructive" });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateItem = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const price_cents = Math.round(Number(form.price || 0) * 100);
    if (!form.name || isNaN(price_cents)) {
      toast({ description: "Please provide a name and valid price.", variant: "destructive" });
      return;
    }

    let imageUrl = form.image_url;
    if (selectedImageFile) {
      const uploadedUrl = await handleImageUpload(selectedImageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const { data, error } = await (supabase as any)
      .from("menu_items")
      .insert({
        chef_user_id: uid,
        name: form.name,
        description: form.description || null,
        price_cents,
        image_url: imageUrl || null,
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
    setSelectedImageFile(null);
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">
                Orders {liveOrders.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
                    {liveOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="how-it-works">How it works</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6">
                {/* Availability Section */}
                {!profileLoading && chefProfile && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Availability</CardTitle>
                      <CardDescription>Manage your online status and weekly schedule</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Online Toggle */}
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                        <div>
                          <h3 className="font-semibold">Online Status</h3>
                          <p className="text-sm text-muted-foreground">
                            {isOnline ? "You're accepting orders now" : "You're currently offline"}
                          </p>
                        </div>
                        <Switch checked={isOnline} onCheckedChange={toggleOnlineStatus} />
                      </div>

                      {/* Weekly Schedule */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Weekly Schedule</h3>
                          <Button onClick={updateSchedule} size="sm">Save Schedule</Button>
                        </div>
                        <div className="space-y-3">
                          {Object.keys(schedule).map((day) => (
                            <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                              <div className="flex items-center gap-3 min-w-[140px]">
                                <Switch
                                  checked={schedule[day].enabled}
                                  onCheckedChange={(checked) =>
                                    setSchedule({ ...schedule, [day]: { ...schedule[day], enabled: checked } })
                                  }
                                />
                                <span className="font-medium capitalize">{day}</span>
                              </div>
                              {schedule[day].enabled && (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    type="time"
                                    value={schedule[day].open}
                                    onChange={(e) =>
                                      setSchedule({ ...schedule, [day]: { ...schedule[day], open: e.target.value } })
                                    }
                                    className="w-32"
                                  />
                                  <span className="text-muted-foreground">to</span>
                                  <Input
                                    type="time"
                                    value={schedule[day].close}
                                    onChange={(e) =>
                                      setSchedule({ ...schedule, [day]: { ...schedule[day], close: e.target.value } })
                                    }
                                    className="w-32"
                                  />
                                </div>
                              )}
                              {!schedule[day].enabled && (
                                <span className="text-sm text-muted-foreground">Closed</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Show loading state */}
                {profileLoading && (
                  <Card>
                    <CardContent className="py-8 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading profile...</span>
                    </CardContent>
                  </Card>
                )}

                {/* Show read-only profile view when profile exists and not editing */}
                {!profileLoading && chefProfile && !showAddressForm && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Chef Profile</CardTitle>
                          <CardDescription>Your business and contact information</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setShowAddressForm(true)}>
                          Edit Profile
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Business/Chef Name</Label>
                          <p className="text-sm font-medium">{chefProfile.pickup_business_name || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Contact Phone</Label>
                          <p className="text-sm font-medium">{chefProfile.pickup_phone || "Not set"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Pickup Address</Label>
                        <p className="text-sm font-medium">{chefProfile.pickup_address || "Not set"}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">City</Label>
                          <p className="text-sm font-medium">{chefProfile.city || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">ZIP Code</Label>
                          <p className="text-sm font-medium">{chefProfile.zip || "Not set"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Display Name</Label>
                        <p className="text-sm font-medium">{chefProfile.display_name || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Bio</Label>
                        <p className="text-sm">{chefProfile.bio || "Not set"}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Location (Latitude)</Label>
                          <p className="text-sm font-medium">{chefProfile.lat || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Location (Longitude)</Label>
                          <p className="text-sm font-medium">{chefProfile.lng || "Not set"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Show edit form when no profile exists or explicitly editing */}
                {!profileLoading && (!chefProfile || showAddressForm) && (
                  <Card className="animate-fade-in">
                    <CardHeader>
                      <CardTitle>{chefProfile ? "Edit Chef Profile" : "Complete Your Chef Profile"}</CardTitle>
                      <CardDescription>
                        We need your pickup address and contact information for delivery integration.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="pickup_business_name">Business/Chef Name *</Label>
                          <Input 
                            id="pickup_business_name"
                            value={addressForm.pickup_business_name}
                            onChange={(e) => setAddressForm(f => ({...f, pickup_business_name: e.target.value}))}
                            placeholder="Chef Maria's Kitchen"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="pickup_phone">Contact Phone *</Label>
                          <Input 
                            id="pickup_phone"
                            value={addressForm.pickup_phone}
                            onChange={(e) => setAddressForm(f => ({...f, pickup_phone: e.target.value}))}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pickup_address">Pickup Address *</Label>
                        <Input 
                          id="pickup_address"
                          value={addressForm.pickup_address}
                          onChange={(e) => setAddressForm(f => ({...f, pickup_address: e.target.value}))}
                          placeholder="123 Main St, Apt 4B"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="city">City</Label>
                          <Input 
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm(f => ({...f, city: e.target.value}))}
                            placeholder="Brooklyn"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="zip">ZIP Code</Label>
                          <Input 
                            id="zip"
                            value={addressForm.zip}
                            onChange={(e) => setAddressForm(f => ({...f, zip: e.target.value}))}
                            placeholder="11201"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input 
                          id="display_name"
                          value={addressForm.display_name}
                          onChange={(e) => setAddressForm(f => ({...f, display_name: e.target.value}))}
                          placeholder="Chef Maria"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio"
                          value={addressForm.bio}
                          onChange={(e) => setAddressForm(f => ({...f, bio: e.target.value}))}
                          placeholder="Passionate about authentic Italian cuisine..."
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location Coordinates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Set your location so customers can find you when searching nearby.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="lat">Latitude</Label>
                            <Input 
                              id="lat"
                              type="number"
                              step="any"
                              value={addressForm.lat || ""}
                              onChange={(e) => setAddressForm(f => ({...f, lat: e.target.value ? parseFloat(e.target.value) : null}))}
                              placeholder="40.7128"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="lng">Longitude</Label>
                            <Input 
                              id="lng"
                              type="number"
                              step="any"
                              value={addressForm.lng || ""}
                              onChange={(e) => setAddressForm(f => ({...f, lng: e.target.value ? parseFloat(e.target.value) : null}))}
                              placeholder="-74.0060"
                            />
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (!("geolocation" in navigator)) {
                              toast({ description: "Geolocation not supported", variant: "destructive" });
                              return;
                            }
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                setAddressForm(f => ({
                                  ...f, 
                                  lat: pos.coords.latitude, 
                                  lng: pos.coords.longitude
                                }));
                                toast({ description: "Location detected!" });
                              },
                              () => toast({ description: "Location access denied", variant: "destructive" }),
                              { enableHighAccuracy: true, timeout: 10000 }
                            );
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Use My Current Location
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveAddress}>Save Profile</Button>
                        {chefProfile && (
                          <Button variant="outline" onClick={() => setShowAddressForm(false)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="rounded-xl border bg-card p-6 space-y-4 animate-fade-in">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                  <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total earnings (30d)</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {metrics ? `$${dollars(metrics.totalEarningsCents)}` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Orders (30d)</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {metrics ? metrics.orderCount : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Avg order value</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {metrics ? `$${dollars(metrics.avgOrderValueCents)}` : "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-6 animate-fade-in">
                  <p className="font-medium mb-4">Earnings last 30 days</p>
                  <ChartContainer
                    config={{ earnings: { label: "Earnings", color: "hsl(var(--primary))" } }}
                    className="w-full"
                  >
                    <LineChart data={earnings.map((e) => ({ date: e.date.slice(5), earnings: e.total_cents / 100 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent labelKey="date" nameKey="earnings" />} />
                      <Line type="monotone" dataKey="earnings" stroke="var(--color-earnings)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </div>

                <div className="rounded-xl border bg-card p-6 animate-fade-in">
                  <p className="font-medium mb-4">Recent orders</p>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsLoading ? (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : recentOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-muted-foreground">No recent orders.</TableCell>
                          </TableRow>
                        ) : (
                          recentOrders.map((o) => (
                            <TableRow key={o.id}>
                              <TableCell className="whitespace-nowrap text-sm">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>${dollars(o.amount)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{o.status || "—"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Orders</CardTitle>
                    <CardDescription>Orders that need your attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading orders...</span>
                      </div>
                    ) : liveOrders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No active orders</p>
                        <p className="text-sm">New orders will appear here in real-time</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {liveOrders.map((order) => (
                          <Card key={order.id} className="border-2">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-lg">
                                    Order #{order.id.slice(0, 8)}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {format(new Date(order.created_at), 'PPp')}
                                  </div>
                                </div>
                                <Badge variant={
                                  order.delivery_status === 'created' ? 'secondary' :
                                  order.delivery_status === 'confirmed' ? 'default' :
                                  'outline'
                                }>
                                  {order.delivery_status || 'New'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Order Items */}
                              {order.order_items && order.order_items.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Items:</p>
                                  <ul className="space-y-1">
                                    {order.order_items.map((item: any) => (
                                      <li key={item.id} className="flex justify-between text-sm">
                                        <span>{item.item_name} × {item.quantity}</span>
                                        <span className="text-muted-foreground">
                                          ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="pt-2 border-t flex justify-between font-medium">
                                    <span>Total</span>
                                    <span>${(order.amount / 100).toFixed(2)}</span>
                                  </div>
                                </div>
                              )}

                              {/* Delivery Information */}
                              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Delivery Address</p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.dropoff_address || 'Not specified'}
                                    </p>
                                    {order.dropoff_business_name && (
                                      <p className="text-sm text-muted-foreground">
                                        {order.dropoff_business_name}
                                      </p>
                                    )}
                                    {order.dropoff_phone && (
                                      <p className="text-sm text-muted-foreground">
                                        {order.dropoff_phone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Tracking Link */}
                              {order.delivery_tracking_url && (
                                <Button asChild variant="outline" className="w-full">
                                  <a 
                                    href={order.delivery_tracking_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    Track Delivery →
                                  </a>
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                          <Label htmlFor="image">Dish Photo</Label>
                          <div className="space-y-2">
                            <Input 
                              id="image" 
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedImageFile(file);
                                  setForm((f) => ({ ...f, image_url: "" }));
                                }
                              }}
                              disabled={uploadingImage}
                            />
                            {selectedImageFile && (
                              <p className="text-sm text-muted-foreground">
                                Selected: {selectedImageFile.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch id="available" checked={form.available} onCheckedChange={(val) => setForm((f) => ({ ...f, available: val }))} />
                          <Label htmlFor="available">Available</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateItem} disabled={uploadingImage}>
                          {uploadingImage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Create"
                          )}
                        </Button>
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

            <TabsContent value="how-it-works">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Getting Started as a Chef</CardTitle>
                    <CardDescription>Here's everything you need to know to start selling your homemade food</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">1. Complete Your Profile</h3>
                      <p className="text-sm text-muted-foreground">
                        Fill in your business name, pickup address, phone number, and a brief bio about your cooking style. This information is essential for delivery coordination.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">2. Set Up Stripe Payouts</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect your Stripe account to receive payments directly. Click "Set up payouts" in the Overview tab and complete the onboarding process. This is required to receive earnings.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">3. Add Your Menu Items</h3>
                      <p className="text-sm text-muted-foreground">
                        Create your menu in the Menu tab. Add dish names, descriptions, prices, and images. You can toggle availability on/off for each item as needed.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">4. Receive Orders</h3>
                      <p className="text-sm text-muted-foreground">
                        When customers order, you'll see the order details in your dashboard. Prepare the food and have it ready for pickup by the delivery service.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">5. Delivery Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Orders are automatically coordinated with DoorDash for delivery. The delivery driver will pick up from your provided address and deliver to the customer.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">6. Build Your Reputation</h3>
                      <p className="text-sm text-muted-foreground">
                        Customers rate your food on taste, looks, and price. Check the Reviews tab to see feedback and track your ratings over time.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tips for Success</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Quality photos:</strong> Upload clear, appetizing images of your dishes to attract more customers</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Accurate descriptions:</strong> Be clear about ingredients, portion sizes, and any allergens</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Competitive pricing:</strong> Research similar dishes in your area to set fair prices</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Consistent availability:</strong> Keep your menu items available or mark them unavailable if you can't fulfill orders</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Fast preparation:</strong> Have orders ready on time for smooth delivery coordination</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Respond to feedback:</strong> Use reviews to improve and maintain high ratings</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment & Earnings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>
                      <strong>How you get paid:</strong> Payments are processed through Stripe and deposited directly to your bank account according to your Stripe payout schedule.
                    </p>
                    <p>
                      <strong>Tracking earnings:</strong> View your daily earnings, order count, and average order value in the Overview tab. The chart shows your earnings trends over the last 30 days.
                    </p>
                    <p>
                      <strong>Delivery fees:</strong> Delivery costs are handled separately and added to the customer's total. You receive the full menu price for your items.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default ChefDashboard;
