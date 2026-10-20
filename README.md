# RuangBaik

Prototipe crowdfunding Web3 berdasarkan `PRD.md`, dengan layout dari `Design.md` dan `ref.jpg`. Seluruh tampilan memakai tema light: putih hangat, ungu, hijau lembut, tipografi Manrope, dan animasi Motion. Implementasi berada di direktori proyek ini, menggunakan Next.js sesuai PRD.

**Panduan langkah demi langkah:** [PANDUAN_KONFIGURASI.md](PANDUAN_KONFIGURASI.md) — instalasi lokal, MetaMask, RPC Sepolia, Remix, PostgreSQL, environment, pengujian, deployment Vercel, dan troubleshooting.

**Repositori:** [rendidwi2604/Crowdfunding](https://github.com/rendidwi2604/Crowdfunding).

## Jalankan lokal

Gunakan Node.js 20.9 atau lebih baru.

```powershell
npm.cmd install
npm.cmd run dev
```

Buka **http://localhost:3000**. Proyek Next.js dijalankan melalui Node.js, bukan Apache/PHP, meskipun folder berada di `htdocs`.

Website memakai **Bahasa Indonesia secara default**. Gunakan tombol **ID / EN** di header untuk beralih ke bahasa Inggris atau kembali ke Indonesia. Pilihan disimpan di browser. Kampanye contoh memiliki terjemahan Inggris; tulisan kampanye yang dibuat pengguna tetap tampil sesuai bahasa aslinya.

Tanpa konfigurasi `.env.local`, website berjalan dalam mode demo. Klik **Hubungkan wallet → Coba dengan dompet demo** untuk mendapatkan saldo simulasi 2,5 ETH. Eksplorasi, pencarian, filter, bookmark, pembuatan kampanye, donasi, dan pencairan dapat dicoba. Data demo tersimpan di localStorage browser, tidak mengirim transaksi blockchain. Untuk mencoba pencairan, buat kampanye dengan target 0,01 ETH, donasikan 0,01 ETH, lalu pilih **Cairkan** sebagai pembuat.

## Teknologi

- Next.js App Router, React, TypeScript, Tailwind CSS.
- Motion (`motion/react`) untuk animasi masuk section, transisi modal, dan pergantian cerita. Preferensi `prefers-reduced-motion` dihormati.
- Lucide React untuk ikon.
- Ethers v6 untuk MetaMask, saldo, transaksi dan verifikasi tanda tangan.
- Solidity 0.8.x dan Drizzle + PostgreSQL untuk integrasi dApp.
- Manrope dan foto bawaan disimpan lokal sehingga tampilan tidak bergantung pada CDN saat digunakan.

## Hubungkan Ethereum Sepolia dan PostgreSQL

1. Buka `contracts/Crowdfunding.sol` di [Remix](https://remix.ethereum.org/). Pilih compiler Solidity **0.8.24 atau lebih baru**, optimizer 200 runs dan EVM Shanghai. Deploy melalui Injected Provider MetaMask di **Sepolia (chain ID 11155111)**. Simpan alamat kontraknya.
2. Siapkan database PostgreSQL dan endpoint RPC Ethereum Sepolia yang mendukung `eth_getLogs`.
3. Salin `.env.example` menjadi `.env.local` dan isi:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_alamat_kontrak
SEPOLIA_RPC_URL=https://endpoint-rpc-sepolia
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

4. Terapkan schema (Drizzle memuat `.env.local` melalui konfigurasi proyek):

```powershell
npm.cmd run db:push
```

5. Restart dev server. Ketiga variabel harus lengkap. Saat integrasi aktif, data demo diganti kampanye dari PostgreSQL dengan nilai pendanaan dibaca langsung dari kontrak. Database ini ditujukan untuk satu deployment kontrak; gunakan database/schema baru saat mengganti alamat kontrak.
6. Hubungkan MetaMask, buat kampanye, konfirmasi transaksi, lalu tanda tangani metadata. Tanda tangan tidak memerlukan gas. Jika penyimpanan metadata gagal, transaksi tidak dibuat ulang: draft disimpan di browser dan dapat dilanjutkan melalui **Simpan metadata** pada formulir kampanye.

Tidak ada private key server yang diperlukan. Frontend meminta otorisasi setiap transaksi melalui MetaMask. API menerima metadata hanya setelah memverifikasi receipt Sepolia, alamat kontrak, event `CampaignCreated`, dan tanda tangan pembuat yang terikat pada konten, chain ID, kontrak, serta TxHash.

## Aturan smart contract

- Target harus lebih dari nol dan tenggat berada di masa depan.
- Donasi harus lebih dari nol, sebelum tenggat, dan kampanye belum dicairkan.
- Hanya wallet pembuat yang dapat menarik dana.
- Pencairan dapat dilakukan setelah **target tercapai ATAU tenggat berakhir**.
- Dana tetap dapat dicairkan ketika target tidak tercapai. Tidak ada refund. Aturan ini ditampilkan pada formulir, detail kampanye, FAQ, dan ketentuan.
- Pencairan menutup kampanye dan dibatasi satu kali. Menggunakan checks-effects-interactions dan reentrancy guard.
- Metadata naratif berada di PostgreSQL; jumlah donasi dan status keuangan tetap bersumber dari blockchain.
- Riwayat donasi memuat event dengan paginasi rentang 5.000 blok, tombol untuk menelusuri blok lebih lama, dan TxHash asli menuju Sepolia Etherscan. Campaign count hanya mencakup kampanye yang metadata-nya sudah berhasil disimpan.

## Pemeriksaan

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

Pengujian otomatis memvalidasi nominal, tanggal, URL gambar, dan keterikatan tanda tangan metadata. Pengujian kontrak meng-compile Solidity dan men-deploy ke EVM lokal Ganache, lalu memeriksa donasi, event, akses pencairan, tenggat, dan penolakan pencairan berulang. Transaksi jaringan Sepolia dan persistensi PostgreSQL perlu pengujian integrasi dengan konfigurasi milik Anda.

## Deployment

Deploy sebagai proyek **Next.js** di Vercel atau server Node.js. Isi ketiga variabel environment yang sama, terapkan schema database, lalu jalankan build. Variabel `NEXT_PUBLIC_CONTRACT_ADDRESS` ditanam saat build; perubahan nilainya memerlukan build baru. Kontrak dideploy terpisah melalui Remix. Proyek belum dipublikasikan atau men-deploy kontrak ke jaringan eksternal.

## Struktur

```text
src/app/                       Halaman utama, metadata, stylesheet
src/app/api/campaigns/          API metadata dan riwayat donasi
src/components/ruangbaik.tsx    Interaksi kampanye, wallet, formulir, dashboard
src/components/sections.tsx    Section editorial dan carousel cerita
src/components/ui.tsx          Modal aksesibel, reveal, elemen visual
src/lib/                       Schema, validasi, database, ABI, tanda tangan
contracts/Crowdfunding.sol     Kontrak untuk Remix
tests/                         Pengujian domain dan EVM lokal
public/images/                 Foto lokal
public/fonts/                  Font Manrope dan lisensi OFL
```

Foto ilustrasi berasal dari Unsplash: [relawan](https://images.unsplash.com/photo-1559027615-cd4628902d4a), [hutan](https://images.unsplash.com/photo-1441974231531-c6227db76b6e), [belajar](https://images.unsplash.com/photo-1503676260728-1c00da094a0b), [air](https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2), [komunitas](https://images.unsplash.com/photo-1529156069898-49953e39b3ac). Nama komunitas, kampanye, dan narasi contoh bersifat ilustratif. Logo teknologi menjelaskan stack yang digunakan, bukan kemitraan. Tidak ada testimoni atau statistik pengguna nyata yang diklaim.

Dokumentasi implementasi: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Motion](https://motion.dev/docs/react-installation), [Ethers v6](https://docs.ethers.org/v6/), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql).
