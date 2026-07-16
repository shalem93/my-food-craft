import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Haversine in miles
function distanceMi(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default defineTool({
  name: "search_nearby_dishes",
  title: "Search nearby dishes",
  description: "Find available menu items from online chefs near the given coordinates.",
  inputSchema: {
    lat: z.number().describe("Latitude of the search origin."),
    lng: z.number().describe("Longitude of the search origin."),
    radius_miles: z.number().positive().optional().describe("Search radius in miles (default 15)."),
    query: z.string().optional().describe("Optional text to match in dish name or description."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ lat, lng, radius_miles, query, limit }, ctx) => {
    const radius = radius_miles ?? 15;
    const cap = limit ?? 20;

    let q = sb(ctx)
      .from("menu_items")
      .select("id, name, description, price, image_url, tags, chef_user_id, lat, lng")
      .eq("available", true)
      .not("lat", "is", null)
      .not("lng", "is", null);
    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    const { data, error } = await q.limit(200);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const results = (data ?? [])
      .map((r: any) => ({ ...r, distance_miles: distanceMi(lat, lng, r.lat, r.lng) }))
      .filter((r) => r.distance_miles <= radius)
      .sort((a, b) => a.distance_miles - b.distance_miles)
      .slice(0, cap);

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { dishes: results },
    };
  },
});
