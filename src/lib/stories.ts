import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Story = {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  author: string;
  published_at: string;
  image_key: string;
  featured: boolean;
  display_order: number;
};

export const storiesQueryOptions = queryOptions({
  queryKey: ["stories", "published"],
  queryFn: async (): Promise<Story[]> => {
    const { data, error } = await supabase
      .from("stories")
      .select("id, slug, category, title, summary, author, published_at, image_key, featured, display_order")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data;
  },
});