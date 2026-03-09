import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

// Lazy-initialized client-side Supabase client
export const getSupabase = () => {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }
  return supabaseInstance;
};

// For backwards compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});
