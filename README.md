# RuangBaik

Aplikasi crowdfunding berbasis Next.js, React, Ethereum Sepolia, dan PostgreSQL.

Panduan deployment tersedia di [Deploy ke Vercel dengan Neon](DEPLOY_VERCEL_NEON.md), termasuk penggunaan koneksi Neon yang sudah ada, penyiapan tabel, environment variable, dan pengujian setelah deploy.

## Menjalankan aplikasi

Gunakan Node.js 20.9 atau lebih baru. Dari folder project:

```powershell
npm.cmd ci
npm.cmd run dev
```

Buka http://localhost:3000. Jika dependensi sudah terpasang, cukup jalankan `npm.cmd run dev`.

Untuk mode produksi:

```powershell
npm.cmd run build
npm.cmd start
```

## Konfigurasi

Aplikasi langsung menggunakan Ethereum Sepolia. Salin `.env.example` menjadi `.env.local`, lalu isi konfigurasi wajib berikut:

- `NEXT_PUBLIC_CONTRACT_ADDRESS`: alamat smart contract di Ethereum Sepolia.
- `SEPOLIA_RPC_URL`: endpoint RPC Sepolia.
- `DATABASE_URL`: koneksi PostgreSQL.
- `DATABASE_URL_UNPOOLED`: koneksi langsung untuk migrasi, jika diperlukan.

Jika konfigurasi belum lengkap atau koneksi gagal, aplikasi menampilkan pesan kesalahan dan tombol muat ulang. Kampanye, donasi, dan pencairan menggunakan smart contract Sepolia; metadata kampanye dan identitas wallet disimpan di PostgreSQL. Aplikasi tidak menggunakan localStorage. Pilihan bahasa dan bookmark hanya berlaku selama tab terbuka. Jika transaksi pembuatan berhasil tetapi metadata belum tersimpan, gunakan tombol “Simpan metadata” di tab yang sama sebelum memuat ulang atau menutup halaman.

Source smart contract tersedia di `contracts/Crowdfunding.sol` untuk deployment melalui Remix. Terapkan schema database saat menyiapkan database baru dengan `npm.cmd run db:push`, lalu restart aplikasi. Perubahan alamat kontrak memerlukan build ulang untuk mode produksi.

## Isi project

- `src/`: halaman, komponen, API, dan logika aplikasi.
- `public/`: gambar, font, dan lisensi font yang digunakan.
- `contracts/`: source smart contract crowdfunding.
- `drizzle.config.ts`: konfigurasi penyiapan schema PostgreSQL.
- `package.json` dan `package-lock.json`: dependensi dan perintah aplikasi.

Jalankan `npm.cmd run typecheck` untuk memeriksa TypeScript. Dependensi di `node_modules/` diperlukan untuk menjalankan dan membangun aplikasi. Folder `.next/` dibuat otomatis; `npm.cmd start` memerlukan hasil `npm.cmd run build`.
