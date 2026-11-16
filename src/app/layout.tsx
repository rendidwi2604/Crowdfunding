import type { Metadata } from 'next';
import './globals.css';
import './solid-theme.css';
export const metadata: Metadata = { title: 'RuangBaik — Kebaikan kecil. Dampak besar.', description: 'Ruang untuk mendanai perubahan. Jelajahi dan dukung kampanye sosial dengan crowdfunding transparan di Ethereum Sepolia.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      {/* Browser extensions such as Grammarly inject attributes on body before hydration. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
