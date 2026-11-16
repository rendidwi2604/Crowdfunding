export const MAX_IMAGE_BYTES = 1024 * 1024;
export const MAX_IMAGE_VALUE_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 64;
export const IMAGE_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Inline uploads are stored with signed campaign metadata in PostgreSQL.
export function isUploadedImage(value: string): boolean {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || value.length > MAX_IMAGE_VALUE_LENGTH || match[2].length % 4 !== 0) return false;
  try {
    const bytes = atob(match[2]);
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return false;
    if (match[1] === 'image/jpeg') return bytes.startsWith('\xff\xd8\xff');
    if (match[1] === 'image/png') return bytes.startsWith('\x89PNG\r\n\x1a\n');
    return bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP';
  } catch { return false; }
}

// Google Images shares an HTML results page; imgurl contains the actual image.
export function normalizeImageUrl(value: string): string {
  const input = value.trim();
  try {
    const url = new URL(input);
    if (/^(www\.)?google\.(com|co\.id)$/.test(url.hostname) && url.pathname === '/imgres') {
      const image = new URL(url.searchParams.get('imgurl') || '');
      return image.protocol === 'https:' ? image.href : '';
    }
  } catch {
    // Local bundled images and invalid URLs are validated by the form schema.
    if (/^https:\/\/(www\.)?google\.(com|co\.id)\/imgres(?:\?|$)/.test(input)) return '';
  }
  return input;
}

export function isImageUrl(value: string): boolean {
  if (value.startsWith('data:')) return isUploadedImage(value);
  if (value.length > 2000) return false;
  if (/^\/images\/[\w-]+\.jpg$/.test(value)) return true;
  try { return new URL(value).protocol === 'https:'; }
  catch { return false; }
}
