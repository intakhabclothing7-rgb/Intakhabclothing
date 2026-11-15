import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabasePublicKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const STORAGE_BUCKET = 'intakhab-media';

function validateSupabaseConfig(url: string, key: string): string | null {
  if (!url || url.includes('YOUR_PROJECT_REF')) {
    return 'Missing VITE_SUPABASE_URL environment variable.';
  }
  if (!/^https:\/\/[a-zA-Z0-9.-]+/.test(url)) {
    return 'VITE_SUPABASE_URL must be a valid https:// Supabase project URL.';
  }
  if (!key || key.includes('YOUR_SUPABASE_')) {
    return 'Missing VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) environment variable.';
  }
  if (key.startsWith('sb_secret_')) {
    return 'Invalid client key: never use a secret/service_role key in VITE_ variables. Use the public publishable or anon key.';
  }
  return null;
}

export const supabaseConfigError: string | null = validateSupabaseConfig(
  supabaseUrl,
  supabasePublicKey
);

export const isSupabaseConfigured = supabaseConfigError === null;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublicKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface UploadResult {
  publicUrl: string;
  path: string;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30MB

export async function uploadMediaToSupabase(
  file: File,
  folder: 'products' | 'hero' | 'categories' | 'promotional' | 'review-uploads',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  if (!supabase) {
    throw new Error(
      supabaseConfigError ||
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).'
    );
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !(folder === 'review-uploads' && isVideo)) {
    throw new Error('Unsupported file type. Please upload a valid JPG, PNG, or WEBP image.');
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image size exceeds 8MB limit. Please compress or choose a smaller file.');
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error('Video size exceeds 30MB limit. Please choose a shorter clip.');
  }

  const cleanExt = (file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg'))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${cleanExt}`;
  const filePath = `${folder}/${uniqueName}`;

  if (onProgress) onProgress(25);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'Failed to upload image to Supabase Storage.');
  }

  if (onProgress) onProgress(85);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Uploaded file URL could not be resolved.');
  }

  if (onProgress) onProgress(100);

  return {
    publicUrl: data.publicUrl,
    path: filePath,
  };
}
