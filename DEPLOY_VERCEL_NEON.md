# Deploy RuangBaik ke Vercel dengan Neon

Panduan untuk proyek ini: Next.js 16, React 19, Drizzle ORM, PostgreSQL pada Neon, dan Ethereum Sepolia. Perintah terminal menggunakan PowerShell Windows.

**Anda sudah terhubung dengan Neon.** Gunakan project dan database yang sudah ada. Pemeriksaan konfigurasi lokal menunjukkan empat variabel aplikasi sudah terisi; URL database aplikasi memakai host Neon pooled dan URL schema memakai host direct, keduanya dengan `sslmode=require`. Pemeriksaan ini belum menguji koneksi jaringan atau keberadaan tabel.

## 1. Siapkan kebutuhan

- Repository GitHub berisi proyek ini dan akun Vercel.
- Akses ke project Neon yang sudah digunakan.
- Node.js 24.x dan npm lokal; pilih Node.js 24.x juga di Vercel agar versi mayor konsisten.
- Alamat smart contract RuangBaik yang sudah di-deploy pada **Ethereum Sepolia**.
- Endpoint HTTPS RPC Sepolia yang dapat diakses server Vercel.
- MetaMask dan Sepolia ETH untuk menguji transaksi.

Vercel menjalankan website dan API Next.js. Neon menyimpan profil dan metadata kampanye. Kontrak tetap berjalan di Sepolia. Gunakan kontrak yang cocok dengan `contracts/Crowdfunding.sol` dan ABI di `src/lib/contract.ts`.

## 2. Periksa pengaturan Neon yang sudah ada

1. Buka Neon Console, lalu pilih project yang sudah terhubung.
2. Pilih branch, database, dan role yang akan digunakan website hasil deploy. Catat pilihannya agar tidak tertukar dengan database development.
3. Buka **Connect** atau detail koneksi.
4. Aktifkan **Connection pooling**, lalu salin connection string untuk `DATABASE_URL`.
5. Nonaktifkan pooling, lalu salin connection string direct untuk `DATABASE_URL_UNPOOLED` lokal.
6. Pertahankan parameter SSL dan parameter lain dari Neon. Salin URI PostgreSQL saja, bukan perintah `psql`.

| Variabel | Jenis koneksi | Digunakan oleh |
| --- | --- | --- |
| `DATABASE_URL` | Pooled; hostname mengandung `-pooler` | API aplikasi melalui `src/lib/server.ts` |
| `DATABASE_URL_UNPOOLED` | Direct; hostname tanpa `-pooler` | Penyiapan schema melalui `drizzle.config.ts` |

Kedua URL harus menunjuk **branch dan database yang sama**. Neon menyarankan pooled untuk serverless dan direct untuk migrasi. Sumber: [connection pooling Neon](https://neon.com/docs/connect/connection-pooling).

Jika sudah memakai integrasi Neon di Vercel, periksa environment variable yang dimasukkan integrasi tersebut. Kode ini membaca nama persis `DATABASE_URL`, bukan `POSTGRES_URL`. Mengisi variabel secara manual juga cukup; tidak perlu membuat project Neon baru.

## 3. Periksa environment lokal

Pertahankan nilai asli pada `.env.local` yang sudah bekerja. Berikut hanya contoh bentuknya, **bukan nilai untuk langsung dipakai**:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_ALAMAT_KONTRAK_SEPOLIA_ANDA
SEPOLIA_RPC_URL=https://ENDPOINT_RPC_SEPOLIA_ANDA
DATABASE_URL=postgresql://ROLE:PASSWORD@HOST_POOLER/DATABASE?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://ROLE:PASSWORD@HOST_DIRECT/DATABASE?sslmode=require
```

Jangan menimpa `.env.local` dengan `.env.example` karena konfigurasi Anda sudah terisi. `.env.local` sudah diabaikan oleh `.gitignore`.

`NEXT_PUBLIC_CONTRACT_ADDRESS` memang dibaca browser. Ketiga variabel lainnya merupakan konfigurasi server; jangan tambahkan awalan `NEXT_PUBLIC_`. Private key dan seed phrase MetaMask tidak diperlukan di Vercel.

## 4. Periksa tabel pada Neon

Pada **SQL Editor**, pilih branch/database tujuan dan jalankan query baca saja ini:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'campaigns')
ORDER BY table_name;
```

Hasil yang diharapkan: `campaigns` dan `users`. Definisi lengkap kolom dan constraint ada di `src/lib/schema.ts`.

Jika database baru atau schema belum diterapkan, jalankan dari folder proyek:

```powershell
Set-Location C:\php\htdocs\Crowfunding
npm.cmd ci
npm.cmd run db:push
```

`db:push` membaca `.env.local`, mengutamakan `DATABASE_URL_UNPOOLED`, lalu menyelaraskan database dengan schema Drizzle. Baca perubahan yang ditawarkan sebelum menyetujuinya. Untuk database yang berisi data penting, uji perubahan pada branch Neon terpisah terlebih dahulu. Jika schema sudah sesuai, lewati `db:push`.

Ulangi query pemeriksaan tabel setelah selesai. Tabel donasi dan pencairan tidak diperlukan oleh implementasi ini karena informasi transaksinya dibaca dari Sepolia.

`db:push` hanya mengubah schema, bukan memindahkan isi database lama ke database lain. Panduan ORM: [Drizzle dengan Neon](https://neon.com/docs/guides/drizzle).

## 5. Verifikasi aplikasi lokal

Jika dependensi belum terpasang sesuai lockfile, jalankan `npm.cmd ci` terlebih dahulu. Kemudian:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

Buka `http://localhost:3000` dan `http://localhost:3000/api/campaigns`.

API diharapkan memberi HTTP `200` dengan objek `campaigns`. Array kosong wajar jika belum ada kampanye. Build berhasil belum membuktikan database dan RPC dapat diakses, sehingga pemeriksaan API tetap diperlukan. Hentikan server lokal dengan `Ctrl+C` setelah selesai.

## 6. Push kode ke GitHub

1. Gunakan repository proyek yang sudah ada, atau buat repository jika belum tersedia.
2. Tinjau perubahan dengan `git status` dan `git diff` atau Source Control IDE.
3. Commit file yang memang ingin di-deploy, lalu push ke branch sumber deployment, misalnya `main`.
4. Pastikan `package.json`, `package-lock.json`, `src/`, `public/`, konfigurasi Next.js, TypeScript, PostCSS, dan file pendukung proyek ikut disimpan.
5. Pastikan `.env.local`, `node_modules/`, dan `.next/` tidak ikut repository.

`.env.example` boleh ikut karena hanya berisi nama variabel dan contoh konfigurasi.

## 7. Import repository di Vercel

1. Masuk ke Vercel Dashboard.
2. Pilih **Add New → Project**.
3. Hubungkan GitHub bila diperlukan, lalu **Import** repository RuangBaik.
4. Isi nama project, misalnya `ruangbaik`.
5. Periksa konfigurasi berikut:

| Pengaturan | Nilai |
| --- | --- |
| Framework Preset | `Next.js` |
| Root Directory | Folder berisi `package.json`; root repository jika strukturnya sama dengan proyek lokal |
| Install Command | Default npm, atau `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Default Next.js; biarkan tanpa override |
| Node.js Version | `24.x`; periksa melalui Project Settings |

Next.js didukung langsung oleh Vercel. Struktur proyek ini tidak memerlukan `vercel.json`, static export, atau pengaturan `npm start` pada dashboard. Referensi: [Next.js di Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [konfigurasi build](https://vercel.com/docs/builds/configure-a-build), dan [versi Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## 8. Isi environment variable Vercel

Sebelum menekan Deploy, buka **Environment Variables**. Jika project sudah dibuat, buka **Project → Settings → Environment Variables**.

Masukkan nilai asli dari konfigurasi Anda:

| Nama | Nilai | Kebutuhan |
| --- | --- | --- |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Alamat kontrak RuangBaik di Sepolia | Wajib; tersedia saat build |
| `SEPOLIA_RPC_URL` | Endpoint HTTPS RPC Sepolia | Wajib; dibaca API server |
| `DATABASE_URL` | Connection string Neon pooled untuk database tujuan | Wajib; dibaca API server |
| `DATABASE_URL_UNPOOLED` | Connection string Neon direct | Tidak dibutuhkan runtime Vercel pada alur ini; cukup tersedia lokal untuk `db:push` |

Tempel nilai tanpa tanda kutip pembungkus, tanpa awalan `NAMA_VARIABEL=`, dan tanpa perintah `psql`. Pertahankan parameter SSL pada URL database.

Pilih **Production** untuk deployment utama. Jika akan memakai **Preview**, isi tiga variabel wajib pada Preview juga. Untuk percobaan yang menulis data, gunakan branch Neon terpisah dan pasangan konfigurasi database/kontrak yang konsisten.

Environment lokal tidak otomatis tersedia di Vercel. Perubahan environment variable memerlukan deployment baru; nilai `NEXT_PUBLIC_CONTRACT_ADDRESS` dimasukkan ke bundle ketika build. Sumber: [environment variable Vercel](https://vercel.com/docs/environment-variables) dan [environment variable Next.js](https://nextjs.org/docs/app/guides/environment-variables).

## 9. Deploy

1. Klik **Deploy**.
2. Periksa Build Logs sampai status **Ready**.
3. Periksa versi Node.js pada **Settings → Build and Deployment → Node.js Version**; gunakan `24.x` dan redeploy jika mengubahnya.
4. Buka domain yang diberikan Vercel, misalnya `https://ruangbaik-xxxx.vercel.app`.
5. Jika memperbaiki environment variable, simpan di Settings lalu gunakan **Deployments → pilih deployment → Redeploy**.

Pertahankan Build Command `npm run build`. Jalankan perubahan schema secara terpisah sebelum versi aplikasi yang membutuhkannya digunakan; jangan memasukkan `db:push` otomatis ke setiap build Preview dan Production.

## 10. Uji setelah deploy

1. Pastikan halaman utama dan gambar bawaan tampil.
2. Buka `https://DOMAIN_ANDA/api/campaigns`: harapkan HTTP `200` dan JSON berisi `campaigns`.
3. Hubungkan MetaMask pada domain Vercel dan gunakan jaringan **Sepolia**, chain ID `11155111`.
4. Simpan identitas wallet, lalu reload untuk memeriksa profil yang tersimpan di Neon.
5. Buat kampanye percobaan, konfirmasi transaksi dan tanda tangan metadata, lalu periksa baris baru pada tabel `campaigns` di Neon.
6. Reload halaman dan pastikan kampanye tetap tampil.
7. Uji donasi kecil dengan Sepolia ETH. Uji pencairan setelah target tercapai atau deadline berakhir sesuai aturan kontrak.

Gambar upload saat ini disimpan sebagai data URL bersama metadata di PostgreSQL, maksimal **1 MB per gambar**. Tidak ada konfigurasi bucket tambahan untuk alur yang sudah ada.

Jika transaksi pembuatan kampanye berhasil tetapi metadata gagal tersimpan, gunakan **Simpan metadata** pada tab yang sama sebelum reload atau menutup tab.

## 11. Troubleshooting

| Gejala | Tindakan |
| --- | --- |
| Pesan integrasi belum dikonfigurasi / HTTP `503` | Periksa tiga variabel wajib, format alamat kontrak, pilihan Production/Preview, lalu redeploy. |
| Log berisi `relation "users" does not exist` atau `relation "campaigns" does not exist` | Terapkan schema pada branch/database yang benar dengan `npm.cmd run db:push`. |
| `password authentication failed` | Salin ulang URI Neon dengan role/database yang benar, perbarui environment Vercel, lalu redeploy. |
| Koneksi timeout atau SSL error | Periksa compute Neon, hostname, parameter SSL, dan pembatasan jaringan jika diaktifkan. |
| `RPC harus menggunakan jaringan Sepolia` | Gunakan endpoint RPC Sepolia, lalu redeploy. |
| Kampanye gagal dimuat | Periksa Runtime Logs Vercel untuk membedakan error database, RPC, atau kontrak; pastikan alamat dan ABI cocok. |
| Lokal berhasil tetapi Vercel gagal | Cocokkan environment variable, pilihan Production/Preview, versi Node.js, serta branch/database tujuan. |
| Alamat kontrak masih yang lama | Ubah `NEXT_PUBLIC_CONTRACT_ADDRESS` dan buat build/deployment baru. |
| Data kampanye tidak cocok setelah mengganti kontrak | Metadata menyimpan ID kampanye tanpa namespace alamat kontrak. Gunakan database/branch terpisah untuk kontrak baru atau rencanakan migrasi data. |
| Build mencari output `public` atau `dist` | Pilih preset Next.js dan hapus override Output Directory. |
| MetaMask tidak terbaca | Gunakan browser dengan ekstensi MetaMask atau browser internal MetaMask, lalu hubungkan akun pada domain deployment. |

Periksa log deployment/Functions di Vercel ketika API gagal. Samarkan connection string, password, dan token RPC saat membagikan log.

## Urutan singkat untuk kondisi Anda

1. Pakai koneksi Neon yang sudah ada.
2. Pastikan tabel `users` dan `campaigns` tersedia; `db:push` hanya jika diperlukan.
3. Jalankan typecheck, build, dan uji API lokal.
4. Commit/push kode yang sudah ditinjau ke GitHub.
5. Import ke Vercel dengan preset Next.js dan Node.js 24.x.
6. Isi tiga environment variable wajib untuk Production.
7. Deploy dan uji API, profil, kampanye, serta transaksi Sepolia.
