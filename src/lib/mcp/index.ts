import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyOrders from "./tools/list-my-orders";
import listMyMenuItems from "./tools/list-my-menu-items";
import createMenuItem from "./tools/create-menu-item";
import getMyChefProfile from "./tools/get-my-chef-profile";
import searchNearbyDishes from "./tools/search-nearby-dishes";

// Build the OAuth issuer from the Supabase project ref (inlined at build time).
// Do NOT read process.env at module top level — this file is import-evaluated
// during manifest extraction and edge-function cold start.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "homemade-mcp",
  title: "Homemade",
  version: "0.1.0",
  instructions:
    "Tools for Homemade — a marketplace connecting customers with local home chefs. " +
    "Customers can list their orders and search for nearby dishes. " +
    "Chefs can view/update their profile and manage their menu items.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listMyOrders,
    searchNearbyDishes,
    getMyChefProfile,
    listMyMenuItems,
    createMenuItem,
  ],
});
