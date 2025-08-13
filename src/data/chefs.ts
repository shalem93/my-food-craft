import heroImage from "@/assets/hero-homemade.jpg";
import chef1 from "@/assets/chef-1.jpg";
import chef2 from "@/assets/chef-2.jpg";
import chef3 from "@/assets/chef-3.jpg";
import dish1 from "@/assets/dish-1.jpg";
import dish2 from "@/assets/dish-2.jpg";
import dish3 from "@/assets/dish-3.jpg";
import dish4 from "@/assets/dish-4.jpg";
import dish5 from "@/assets/dish-5.jpg";
import dish6 from "@/assets/dish-6.jpg";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // in smallest currency unit for real apps; here float for demo
  image: string;
};

export type Chef = {
  id: string;
  slug: string;
  name: string;
  rating: number;
  tasteRating?: number;
  looksRating?: number;
  priceLevel?: number; // 1-4 like Yelp style
  deliveryEta: string;
  tags: string[];
  image: string;
  banner?: string;
  city?: string;
  lat?: number;
  lng?: number;
  menu: MenuItem[];
};

export const chefs: Chef[] = [
  {
    id: "1",
    slug: "nonnas-kitchen",
    name: "Nonna's Kitchen",
    rating: 4.9,
    tasteRating: 4.8,
    looksRating: 4.6,
    priceLevel: 2,
    deliveryEta: "30–45 min",
    tags: ["Italian", "Pasta", "Bread"],
    image: chef1,
    banner: heroImage,
    city: "Brooklyn, NY",
    lat: 40.6782,
    lng: -73.9442,
    menu: [
      {
        id: "1-1",
        name: "Handmade Tagliatelle Bolognese",
        description: "Slow-cooked ragu, parmesan, and fresh basil.",
        price: 14.5,
        image: dish1,
      },
      {
        id: "1-2",
        name: "Warm Sourdough & Butter",
        description: "Crusty loaf baked this morning with sea salt butter.",
        price: 6.0,
        image: dish4,
      },
      {
        id: "1-3",
        name: "Garden Salad",
        description: "Crisp greens, tomatoes, cucumber, lemon vinaigrette.",
        price: 8.0,
        image: dish3,
      },
    ],
  },
  {
    id: "2",
    slug: "ramen-lab",
    name: "Ramen Lab by Kenji",
    rating: 4.8,
    tasteRating: 4.7,
    looksRating: 4.5,
    priceLevel: 2,
    deliveryEta: "25–40 min",
    tags: ["Japanese", "Ramen", "Comfort"],
    image: chef2,
    city: "San Francisco, CA",
    lat: 37.7749,
    lng: -122.4194,
    menu: [
      {
        id: "2-1",
        name: "Tonkotsu Ramen",
        description: "Rich pork broth, chashu, egg, scallions, sesame.",
        price: 15.0,
        image: dish6,
      },
      {
        id: "2-2",
        name: "Veggie Miso Ramen",
        description: "Umami miso base with seasonal vegetables.",
        price: 13.0,
        image: dish6,
      },
      {
        id: "2-3",
        name: "Sushi Sampler",
        description: "Assorted rolls with seasonal fillings.",
        price: 16.0,
        image: dish5,
      },
    ],
  },
  {
    id: "3",
    slug: "fresh-bites",
    name: "Fresh Bites by Amara",
    rating: 4.7,
    tasteRating: 4.6,
    looksRating: 4.4,
    priceLevel: 2,
    deliveryEta: "20–35 min",
    tags: ["Mediterranean", "Healthy", "Salads"],
    image: chef3,
    city: "Austin, TX",
    lat: 30.2672,
    lng: -97.7431,
    menu: [
      {
        id: "3-1",
        name: "Mediterranean Salad Bowl",
        description: "Feta, olives, tomato, cucumber, lemon-herb dressing.",
        price: 12.0,
        image: dish3,
      },
      {
        id: "3-2",
        name: "Hearty Beef Stew",
        description: "Slow simmered with root vegetables and herbs.",
        price: 14.0,
        image: dish2,
      },
      {
        id: "3-3",
        name: "Homestyle Pasta",
        description: "Comforting red sauce, fresh herbs, parmesan.",
        price: 11.5,
        image: dish1,
      },
    ],
  },
];

export function getChefBySlug(slug: string) {
  return chefs.find((c) => c.slug === slug);
}
