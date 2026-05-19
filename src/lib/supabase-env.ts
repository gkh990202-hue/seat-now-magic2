/** Server + client safe Supabase config (Vite only inlines VITE_* into server bundles). */
export function getSupabaseUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL?.trim() ||
    import.meta.env.VITE_SUPABASE_URL?.trim() ||
    undefined
  );
}

export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    undefined
  );
}

export function getSupabaseProjectRef(): string | undefined {
  const url = getSupabaseUrl();
  if (!url) return undefined;
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return undefined;
  }
}
