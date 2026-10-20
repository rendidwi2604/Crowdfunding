import { z } from 'zod';

export const categories = ['Semua', 'Lingkungan', 'Pendidikan', 'Kemanusiaan', 'Kesehatan'] as const;
export type Category = Exclude<(typeof categories)[number], 'Semua'>;
export type Donation = { address: string; amount: string; hash?: string; date: string };
export type Campaign = { id: string; title: string; description: string; category: Category; image: string; location: string; creator: string; organizer: string; target: string; raised: string; deadline: string; donations: Donation[]; withdrawn: boolean; demo: boolean; creationBlock?: number };
export const DEMO_ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
export const eth = (value: string | number) => Number(value).toLocaleString('id-ID', { maximumFractionDigits: 4 });
export const daysLeft = (deadline: string) => Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
export const progress = (c: Campaign) => Math.min(100, Math.round(Number(c.raised) / Number(c.target) * 100));
export function demoCampaigns(): Campaign[] {
  const deadline = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
  const sampleDonations: Donation[] = [
    { address: '0x8bD984AAbCDAB66aD37B46be54865F1328721131', amount: '0.08', date: new Date(Date.now() - 3600000).toISOString() },
    { address: '0x4cB812B0A347FeABDe782323C72Df3c40F5C9232', amount: '0.12', date: new Date(Date.now() - 7200000).toISOString() },
  ];
  return [
    { id: 'demo-1', title: 'Satu pohon, sejuta harapan untuk bumi.', description: 'Bersama komunitas lokal, kita bisa menghidupkan kembali ruang hijau di lereng Jawa Barat. Kampanye contoh ini mengilustrasikan pengadaan bibit pohon, penanaman bersama warga, dan perawatan selama satu tahun.\n\nSetiap dukungan menjadi langkah kecil untuk menjaga sumber air dan menciptakan habitat yang lebih baik. Rencana penggunaan dana: 50% pengadaan bibit, 30% kegiatan penanaman, dan 20% perawatan serta pelaporan.\n\nIni adalah kampanye demonstrasi untuk mencoba pengalaman RuangBaik. Tidak ada dana nyata yang dikumpulkan.', category: 'Lingkungan', image: '/images/forest.jpg', location: 'Jawa Barat, Indonesia', creator: '0x30cB812B0A347FeABDe782323C72Df3c40F5C9232', organizer: 'Bumi Kita', target: '5', raised: '3.42', deadline: deadline(18), donations: sampleDonations, withdrawn: false, demo: true },
    { id: 'demo-2', title: 'Buka buku, buka masa depan mereka.', description: 'Akses buku yang layak membuka lebih banyak kesempatan belajar. Kampanye contoh ini menggambarkan perpustakaan kecil untuk anak-anak di Flores.\n\nDukungan dialokasikan untuk buku bacaan, alat belajar, dan rak perpustakaan. Relawan akan mendampingi kegiatan membaca setiap minggu.\n\nKampanye ini adalah ilustrasi, bukan penggalangan dana yang sedang berlangsung.', category: 'Pendidikan', image: '/images/education.jpg', location: 'Flores, Indonesia', creator: DEMO_ADDRESS, organizer: 'Ruang Belajar', target: '3', raised: '1.85', deadline: deadline(24), donations: sampleDonations.slice(0, 1), withdrawn: false, demo: true },
    { id: 'demo-3', title: 'Air bersih untuk kehidupan lebih baik.', description: 'Air bersih adalah awal dari kehidupan yang sehat. Kampanye contoh ini memperlihatkan pendanaan sarana penampungan air dan saluran air sederhana untuk warga di Nusa Tenggara Timur.\n\nDana direncanakan untuk material, instalasi bersama warga, dan perawatan. Setiap tahap akan disertai dokumentasi.\n\nIni adalah data demo untuk menguji alur donasi platform.', category: 'Kemanusiaan', image: '/images/water.jpg', location: 'Sumba, Indonesia', creator: '0x8bD984AAbCDAB66aD37B46be54865F1328721131', organizer: 'Alirkan Kebaikan', target: '8', raised: '5.6', deadline: deadline(12), donations: sampleDonations, withdrawn: false, demo: true },
  ];
}
export const amountSchema = z.string().regex(/^(0|[1-9]\d*)(\.\d{1,18})?$/, 'Gunakan angka dengan maksimal 18 desimal.').refine(v => Number(v) > 0 && Number(v) <= 1000000, 'Jumlah harus lebih dari 0 dan maksimal 1.000.000 ETH.');
export const metadataSchema = z.object({
  title: z.string().trim().min(8, 'Judul minimal 8 karakter.').max(120),
  description: z.string().trim().min(40, 'Cerita minimal 40 karakter.').max(10000),
  category: z.enum(['Lingkungan', 'Pendidikan', 'Kemanusiaan', 'Kesehatan']),
  image: z.string().max(2000).refine(v => /^https:\/\//.test(v) || /^\/images\/[\w-]+\.jpg$/.test(v), 'Gunakan URL gambar HTTPS.'),
  location: z.string().trim().min(2).max(100),
  organizer: z.string().trim().min(2).max(100),
});
export const campaignFormSchema = metadataSchema.extend({ target: amountSchema, deadline: z.string().refine(v => Number.isFinite(Date.parse(v)) && Date.parse(v) > Date.now() + 60000, 'Pilih batas waktu di masa depan.') });
