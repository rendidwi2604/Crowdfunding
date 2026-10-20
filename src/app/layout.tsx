import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'RuangBaik — Kebaikan kecil. Dampak besar.', description: 'Ruang untuk mendanai perubahan. Jelajahi dan dukung kampanye sosial dengan crowdfunding transparan di Ethereum Sepolia.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
