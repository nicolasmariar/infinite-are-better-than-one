// Tipos TypeScript que reflejan el schema de Supabase.
// Regenerar con `pnpm dlx supabase gen types typescript --project-id wsyyhankjpwhtjkbfhrp > lib/supabase/types.ts` cuando cambie el schema.

export type LoraWeight = {
  name: string;
  weight: number;
};

export type Gioconda = {
  id: number;
  filename: string;
  slug: string;
  format: "jpg" | "jpeg" | "png" | "webp";
  width: number;
  height: number;
  file_size_bytes: number | null;

  prompt: string | null;
  negative_prompt: string | null;
  model_base: string | null;
  model_checkpoint: string | null;
  seed: number | null;
  steps: number | null;
  cfg_scale: number | null;
  sampler: string | null;

  loras: LoraWeight[] | null;
  primary_style: string | null;
  is_mixed: boolean;

  coord_x: number | null;
  coord_y: number | null;
  coord_z: number | null;

  view_count: number;
  download_count: number;

  source: "batch_original" | "ai_generated_live";
  created_at: string;
};

export type Style = {
  name: string;
  artist_full_name: string | null;
  artist_slug: string | null;
  description: string | null;
  anchor_x: number | null;
  anchor_y: number | null;
  anchor_z: number | null;
  color_hex: string | null;
  created_at: string;
};

export type SiteConfig = {
  id: 1;
  cycle_duration_seconds: number;
  total_giocondas: number;
  premiere_pueyrredon_year: number | null;
  last_updated: string;
};

export type Download = {
  id: number;
  gioconda_id: number;
  downloaded_at: string;
  ip_hash: string | null;
  user_agent: string | null;
  referrer: string | null;
};
