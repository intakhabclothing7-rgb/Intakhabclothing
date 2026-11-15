import { createClient, SupabaseClient } from '@supabase/supabase-js';

function normalizeEnvValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^(['"])(.*)\1$/, '$2').trim();
}

const supabaseUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
const supabasePublicKey =
  normalizeEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const STORAGE_BUCKET = 'intakhab-media';

function isServiceRoleJwt(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded));
    return decoded?.role === 'service_role';
  } catch {
    return false;
  }
}

function validateSupabaseConfig(url: string, key: string): string | null {
  const missingUrl = !url || url.includes('YOUR_PROJECT_REF');
  const missingKey = !key || key.includes('YOUR_SUPABASE_');

  if (missingUrl && missingKey) {
    return 'Missing VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables. Add them in Cloudflare Pages (Settings -> Environment variables) and trigger a new deployment.';
  }
  if (missingUrl) {
    return 'Missing VITE_SUPABASE_URL environment variable. Add VITE_SUPABASE_URL in Cloudflare Pages (Settings -> Environment variables) and redeploy.';
  }
  if (!/^https:\/\/[a-zA-Z0-9.-]+/.test(url)) {
    return 'VITE_SUPABASE_URL must be a valid https:// Supabase project URL.';
  }
  if (missingKey) {
    return 'Missing VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) environment variable. Add it in Cloudflare Pages (Settings -> Environment variables) and redeploy.';
  }
  if (key.startsWith('sb_secret_') || isServiceRoleJwt(key)) {
    return 'Invalid client key: never use a service_role or secret key in VITE_ variables. Use the public publishable or anon key.';
  }
  return null;
}

export const supabaseConfigError: string | null = validateSupabaseConfig(
  supabaseUrl,
  supabasePublicKey
);

export const isSupabaseConfigured = supabaseConfigError === null;

if (isSupabaseConfigured && typeof document !== 'undefined' && supabaseUrl) {
  try {
    const origin = new URL(supabaseUrl).origin;
    if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = origin;
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);

      const dns = document.createElement('link');
      dns.rel = 'dns-prefetch';
      dns.href = origin;
      document.head.appendChild(dns);
    }
  } catch {
    // Ignore invalid URL errors safely
  }
}

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
