import { z } from 'zod';
import { isImageUrl, normalizeImageUrl, MAX_IMAGE_VALUE_LENGTH } from './images';

export const categories = ['Semua', 'Lingkungan', 'Pendidikan', 'Kemanusiaan', 'Kesehatan'] as const;
export type Category = Exclude<(typeof categories)[number], 'Semua'>;
export type Donation = { address: string; amount: string; hash?: string; date: string };
export type Withdrawal = { address: string; amount: string; totalWithdrawn: string; hash?: string; date: string };
export type Campaign = { id: string; title: string; description: string; category: Category; image: string; location: string; creator: string; organizer: string; registeredName?: string; target: string; raised: string; withdrawn: string; deadline: string; donations: Donation[]; withdrawals: Withdrawal[]; creationBlock?: number };
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
export const eth = (value: string | number, language: 'id' | 'en' = 'id') => Number(value).toLocaleString(language === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: 4 });
export const daysLeft = (deadline: string) => Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
export const progress = (c: Campaign) => Math.min(100, Math.round(Number(c.raised) / Number(c.target) * 100));
export const amountSchema = z.string().regex(/^(0|[1-9]\d*)(\.\d{1,18})?$/, 'Gunakan angka dengan maksimal 18 desimal.').refine(v => Number(v) > 0 && Number(v) <= 1000000, 'Jumlah harus lebih dari 0 dan maksimal 1.000.000 ETH.');
export const metadataSchema = z.object({
  title: z.string().trim().min(8, 'Judul minimal 8 karakter.').max(120),
  description: z.string().trim().min(40, 'Cerita minimal 40 karakter.').max(10000),
  category: z.enum(['Lingkungan', 'Pendidikan', 'Kemanusiaan', 'Kesehatan']),
  image: z.string().max(MAX_IMAGE_VALUE_LENGTH).transform(normalizeImageUrl).refine(isImageUrl, 'Gunakan URL gambar HTTPS atau upload JPG, PNG, atau WebP maksimal 1 MB.'),
  location: z.string().trim().min(2).max(100),
  organizer: z.string().trim().min(2).max(100),
});
export const campaignFormSchema = metadataSchema.extend({ target: amountSchema, deadline: z.string().refine(v => Number.isFinite(Date.parse(v)) && Date.parse(v) > Date.now() + 60000, 'Pilih batas waktu di masa depan.') });
