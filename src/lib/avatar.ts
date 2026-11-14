import * as ImagePicker from 'expo-image-picker';

import { requireSupabase, supabase } from './supabase';

/**
 * Profile pictures live in the private `avatars` bucket under `<userId>/…`. Storage policies
 * only let a user touch their own folder, and the bucket itself enforces size and MIME limits.
 * Here the same limits are checked client-side for faster feedback.
 */
const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function pickAvatar(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    exif: false,
  });
  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

/** @returns the storage path to save on the profile. @throws Error with user-facing copy. */
export async function uploadAvatar(userId: string, asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = EXTENSIONS[mimeType];
  if (!extension) throw new Error('Choose a JPG, PNG or WebP image.');
  if (asset.fileSize && asset.fileSize > MAX_BYTES) throw new Error('Choose an image under 2 MB.');
  const body = await (await fetch(asset.uri)).arrayBuffer();
  if (body.byteLength > MAX_BYTES) throw new Error('Choose an image under 2 MB.');
  const path = `${userId}/avatar-${Date.now()}.${extension}`;
  const { error } = await requireSupabase().storage.from(BUCKET).upload(path, body, { contentType: mimeType, upsert: false });
  if (error) throw new Error('Couldn’t upload your photo. You can add it later in Settings.');
  return path;
}

/** Best-effort cleanup of a replaced photo. */
export async function removeAvatar(path: string): Promise<void> {
  await supabase?.storage.from(BUCKET).remove([path]);
}

export async function avatarSignedUrl(path: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return error ? null : data.signedUrl;
}
