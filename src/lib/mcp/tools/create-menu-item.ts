import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_menu_item",
  title: "Create menu item",
  description: "Add a new menu item for the signed-in chef.",
  inputSchema: {
    name: z.string().min(1).describe("Dish name."),
    price: z.number().positive().describe("Price in dollars, e.g. 12.5."),
    description: z.string().optional(),
    portions_available: z.number().int().min(0).optional(),
    prep_time_minutes: z.number().int().min(0).optional(),
    tags: z.array(z.string()).optional().describe("Tags like 'vegan', 'spicy'."),
    available: z.boolean().optional().describe("Whether the item is currently available (default true)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await sb(ctx)
      .from("menu_items")
      .insert({
        chef_user_id: ctx.getUserId(),
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        portions_available: input.portions_available ?? null,
        prep_time_minutes: input.prep_time_minutes ?? null,
        tags: input.tags ?? null,
        available: input.available ?? true,
      })
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created menu item: ${data?.name} (${data?.id})` }],
      structuredContent: { item: data },
    };
  },
});
