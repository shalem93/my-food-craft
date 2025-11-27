import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
};

export type Chef = {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  city: string;
  lat: number | null;
  lng: number | null;
  is_online: boolean;
  rating: number;
  tasteRating?: number;
  looksRating?: number;
  priceLevel?: number;
  deliveryEta: string;
  tags: string[];
  image: string;
  menu: MenuItem[];
};

export function useChefs() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChefs();
  }, []);

  async function fetchChefs() {
    try {
      setLoading(true);
      
      // Fetch chef profiles that are online
      const { data: profiles, error: profilesError } = await supabase
        .from("chef_profiles")
        .select("*")
        .eq("is_online", true);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setChefs([]);
        setLoading(false);
        return;
      }

      // Fetch menu items for these chefs
      const chefUserIds = profiles.map((p) => p.user_id);
      const { data: menuItems, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .in("chef_user_id", chefUserIds)
        .eq("available", true);

      if (menuError) throw menuError;

      // Fetch ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from("chef_ratings")
        .select("*")
        .in("chef_user_id", chefUserIds);

      if (ratingsError) throw ratingsError;

      // Combine data
      const chefsData: Chef[] = profiles.map((profile) => {
        const chefMenuItems = menuItems?.filter(
          (item) => item.chef_user_id === profile.user_id
        ) || [];

        const chefRating = ratings?.find(
          (r) => r.chef_user_id === profile.user_id
        );

        // Determine tags based on menu items or use generic tags
        const tags = chefMenuItems.length > 0 
          ? ["Homemade", "Local"]
          : ["Homemade"];

        return {
          id: profile.id,
          user_id: profile.user_id,
          display_name: profile.display_name || "Chef",
          bio: profile.bio || "",
          city: profile.city || "",
          lat: profile.lat,
          lng: profile.lng,
          is_online: profile.is_online || false,
          rating: chefRating?.avg_overall || 0,
          tasteRating: chefRating?.avg_taste || undefined,
          looksRating: chefRating?.avg_looks || undefined,
          priceLevel: chefRating?.avg_price ? Math.round(chefRating.avg_price) : 2,
          deliveryEta: "30-45 min",
          tags,
          image: "/placeholder.svg", // You can add profile images later
          menu: chefMenuItems.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description || "",
            price: item.price_cents / 100,
            image: item.image_url || "/placeholder.svg",
            available: item.available,
          })),
        };
      });

      setChefs(chefsData);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching chefs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { chefs, loading, error, refetch: fetchChefs };
}
