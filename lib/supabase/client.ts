import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Named aliases for flexibility and compatibility
export const createBrowserClient = createClient;
export const createBrowserSupabaseClient = createClient;
