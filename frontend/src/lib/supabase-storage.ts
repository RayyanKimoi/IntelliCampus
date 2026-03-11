import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdminInstance: SupabaseClient | null = null;

// Lazy-initialized server-side Supabase client using service role key (bypasses RLS)
export const getSupabaseAdmin = () => {
  if (!supabaseAdminInstance && supabaseUrl && supabaseServiceKey) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  if (!supabaseAdminInstance) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    throw new Error(
      `Supabase Admin client not initialized. Missing environment variables: ${missingVars.join(', ')}. ` +
      `Please add SUPABASE_SERVICE_ROLE_KEY to your .env file.`
    );
  }
  return supabaseAdminInstance;
};

// For backwards compatibility
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});

/**
 * Upload a file to Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param file - File to upload
 * @returns Public URL of the uploaded file
 */
export async function uploadToSupabase(
  bucket: string,
  path: string,
  file: File | Buffer,
  contentType?: string
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    console.error('[Supabase Storage] Upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 */
export async function deleteFromSupabase(
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

  if (error) {
    console.error('[Supabase Storage] Delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * List files in a Supabase Storage bucket
 * @param bucket - Storage bucket name
 * @param path - Folder path to list
 */
export async function listFiles(bucket: string, path: string = '') {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(path);

  if (error) {
    console.error('[Supabase Storage] List error:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data;
}
