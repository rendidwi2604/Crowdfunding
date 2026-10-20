# Panduan Konfigurasi RuangBaik — dari Lokal sampai Online

Panduan ini mengikuti implementasi di [repositori Crowdfunding](https://github.com/rendidwi2604/Crowdfunding). Perintah menggunakan **PowerShell di Windows**. Pada macOS/Linux, ganti `npm.cmd` dengan `npm` dan sesuaikan path folder.

Ada dua cara menjalankan website:

| Mode | Kebutuhan | Penyimpanan dan transaksi |
| --- | --- | --- |
| Demo | Node.js dan dependency proyek | Data contoh dan simulasi tersimpan di browser; tidak memakai blockchain/database |
| Sepolia | MetaMask, ETH testnet, kontrak terdeploy, RPC Sepolia, PostgreSQL | Transaksi di Sepolia; cerita dan gambar kampanye di PostgreSQL |

Urutan konfigurasi: **jalankan demo → siapkan wallet → siapkan RPC → deploy kontrak → siapkan database → isi environment → terapkan schema → uji Sepolia → deploy website**.

## 1. Persiapan perangkat dan akun

Siapkan:

- Node.js 24.x dari [situs resmi Node.js](https://nodejs.org/). Proyek telah diuji menggunakan Node.js 24.2.0.
- Git dari [situs resmi Git](https://git-scm.com/downloads).
- Browser dengan ekstensi [MetaMask resmi](https://metamask.io/download/).
- Akun penyedia PostgreSQL; contoh panduan ini memakai Neon. PostgreSQL lokal juga bisa dipakai.
- Akun penyedia RPC Ethereum Sepolia; contoh menggunakan Alchemy.
- Akun Vercel untuk deployment website setelah pengujian lokal.

Periksa instalasi di terminal:

```powershell
node --version
npm.cmd --version
git --version
```

Gunakan `npm.cmd` agar perintah tidak terhalang kebijakan eksekusi `npm.ps1` di PowerShell. Aplikasi berjalan melalui Node.js, sehingga Apache/PHP tidak diperlukan walaupun folder berada di `htdocs`.

## 2. Ambil proyek dan jalankan mode demo

### Jika menggunakan folder proyek yang sudah ada

```powershell
Set-Location 'C:\php\htdocs\Crowfunding'
npm.cmd ci
npm.cmd run dev
```

### Jika mengunduh di komputer lain

Jalankan dari folder induk yang Anda pilih:

```powershell
git clone https://github.com/rendidwi2604/Crowdfunding.git
Set-Location Crowdfunding
npm.cmd ci
npm.cmd run dev
```

`npm.cmd ci` memakai versi dari `package-lock.json`. Buka **http://localhost:3000**. Hentikan server dengan **Ctrl+C** ketika perlu mengganti konfigurasi.

Tanpa konfigurasi lengkap, aplikasi akan memakai mode demo. Untuk mencobanya:

1. Klik **Hubungkan wallet**.
2. Pilih **Coba dengan dompet demo**; saldo awal simulasi adalah **2,5 ETH**.
3. Buka salah satu kampanye dan pilih **Simulasikan donasi**.
4. Periksa perubahan dana terkumpul dan tab **Riwayat dukungan**.
5. Coba filter kategori, pencarian melalui **Filter**, dan simpan kampanye melalui ikon bookmark.
6. Klik **Mulai galang dana**, isi formulir, dan buat kampanye demo sendiri.
7. Untuk menguji pencairan, buat target **0.01 ETH**, donasikan **0.01 ETH**, lalu gunakan tombol **Cairkan** sebagai pembuat kampanye.

Data demo hanya berlaku di browser tersebut. Menghapus data situs pada browser akan menghapus data demo. Kampanye demo tidak otomatis dipindahkan ke Sepolia.

## 3. Konfigurasi MetaMask dan saldo Sepolia

1. Pasang MetaMask melalui tautan resmi di bagian persiapan, lalu siapkan wallet pengujian melalui aplikasi MetaMask.
2. Buka menu **Networks** dan aktifkan **Show test networks** jika Sepolia belum terlihat.
3. Pilih **Sepolia**, bukan Ethereum Mainnet. Letak menu dapat berbeda antarversi. Lihat [panduan testnet MetaMask](https://support.metamask.io/configure/networks/how-to-view-testnets-in-metamask/).
4. Salin **alamat publik wallet**.
5. Pilih faucet Sepolia dari [daftar faucet di ethereum.org](https://ethereum.org/developers/docs/networks/#sepolia). Ikuti persyaratan faucet dan tunggu saldo testnet masuk.
6. Sediakan saldo untuk deploy kontrak, membuat kampanye, donasi, dan biaya gas. Besarnya gas berubah menurut transaksi; periksa estimasi di MetaMask.

Identitas jaringan yang digunakan kode:

| Parameter | Nilai |
| --- | --- |
| Network | Ethereum Sepolia |
| Chain ID desimal | `11155111` |
| Chain ID heksadesimal | `0xaa36a7` |
| Token pengujian | Sepolia ETH |
| Explorer | `https://sepolia.etherscan.io` |

Website tidak memerlukan seed phrase atau private key Anda. Jangan memasukkannya ke `.env`, source code, atau formulir kampanye. Seluruh persetujuan transaksi dilakukan melalui MetaMask.

## 4. Siapkan endpoint RPC Sepolia

RPC digunakan backend untuk membaca kontrak, memeriksa receipt transaksi, dan mengambil event donasi. Koneksi wallet pengguna tetap melalui MetaMask.

1. Masuk ke [dashboard Alchemy](https://dashboard.alchemy.com/).
2. Siapkan aplikasi/API key dengan akses **Ethereum Sepolia**.
3. Buka detail endpoint dan salin URL **HTTPS JSON-RPC** Sepolia. Gunakan endpoint lengkap dari dashboard.
4. Simpan URL tersebut sebagai nilai `SEPOLIA_RPC_URL` pada langkah 7.

Contoh format, bukan kredensial yang dapat digunakan:

```dotenv
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/GANTI_DENGAN_API_KEY_ANDA"
```

Penyedia lain dapat digunakan selama mendukung JSON-RPC Ethereum Sepolia, termasuk `eth_call`, `eth_getTransactionReceipt`, dan `eth_getLogs`. Aplikasi mengambil riwayat dalam rentang maksimal **5.000 blok per halaman**; pastikan layanan RPC mendukung rentang tersebut atau sesuaikan ukuran rentang di route riwayat. [Referensi Chain API Alchemy](https://www.alchemy.com/docs/get-started).

Jangan memberi awalan `NEXT_PUBLIC_` pada RPC yang memuat API key. Nilai ini dibaca server.

## 5. Deploy smart contract melalui Remix

1. Buka [Remix IDE](https://remix.ethereum.org/).
2. Buat file **`Crowdfunding.sol`** di workspace Remix.
3. Salin seluruh isi file [contracts/Crowdfunding.sol](contracts/Crowdfunding.sol) dari proyek ini.
4. Buka **Solidity Compiler**. Pilih compiler **0.8.24 atau lebih baru**, aktifkan optimizer dengan **200 runs**, dan gunakan EVM **Shanghai**. Catat versi compiler yang dipakai.
5. Compile file dan pastikan tidak ada error.
6. Buka **Deploy & Run Transactions**. Pilih lingkungan wallet browser, misalnya **Injected Provider - MetaMask**; nama menu dapat berbeda antarversi.
7. Hubungkan MetaMask dan periksa jaringan **Sepolia** serta wallet deployer. Jangan memakai Remix VM untuk deployment yang akan dihubungkan ke website.
8. Pilih kontrak **Crowdfunding**. Kontrak ini tidak memerlukan parameter constructor; biarkan nilai ETH untuk deployment **0**.
9. Klik **Deploy**, periksa estimasi gas, dan konfirmasikan sendiri di MetaMask.
10. Setelah terkonfirmasi, salin **alamat kontrak** dari bagian kontrak terdeploy. Alamat kontrak berbeda dari alamat wallet dan TxHash.
11. Buka alamat tersebut di Sepolia Etherscan untuk memastikan deployment ditemukan. Simpan alamat, TxHash deployment, versi compiler, dan pengaturan optimizer untuk dokumentasi skripsi.

Alur koneksi wallet Remix dijelaskan dalam [dokumentasi Deploy & Run](https://remix-ide.readthedocs.io/en/latest/run.html).

Anda tidak perlu menyalin ABI secara manual bila kontrak tidak diubah; ABI sudah tersedia di [src/lib/contract.ts](src/lib/contract.ts). Jika signature fungsi/event diubah, sesuaikan ABI dan pengujian.

## 6. Siapkan PostgreSQL

### Pilihan A — Neon

1. Masuk ke [Neon](https://neon.com/) dan buat proyek PostgreSQL untuk RuangBaik.
2. Pilih branch, database, dan role yang akan digunakan.
3. Klik **Connect** untuk mendapatkan connection string. Neon menyediakan koneksi direct dan pooled; pilihan pooling dapat diubah di dialog koneksi.
4. Salin connection string ke `DATABASE_URL`. Pertahankan pengaturan TLS dari penyedia, seperti `sslmode=require`.
5. Untuk menerapkan schema dari lokal, gunakan koneksi direct. Untuk aplikasi di Vercel, Anda dapat menggunakan koneksi pooled ke **database yang sama**. Driver aplikasi sudah menggunakan `prepare: false`.

[Panduan connection string Neon](https://neon.com/docs/connect/connect-from-any-app) menjelaskan pemilihan branch, database, role, serta pooling.

### Pilihan B — PostgreSQL lokal

Jika PostgreSQL sudah terpasang, buka pgAdmin atau `psql` menggunakan akun yang berhak membuat database, lalu jalankan:

```sql
CREATE DATABASE ruangbaik;
```

Contoh format connection string lokal:

```dotenv
DATABASE_URL="postgresql://USER_DATABASE:PASSWORD_DATABASE@localhost:5432/ruangbaik"
```

Ganti username/password dengan milik Anda. Jika password mengandung karakter khusus untuk URL, gunakan encoding URL atau connection string yang disediakan pengelola database. Database `localhost` hanya dapat diakses aplikasi di mesin tersebut; saat deploy ke Vercel, gunakan database yang dapat dijangkau server Vercel.

## 7. Isi file `.env.local`

Di root proyek, buat salinan template **hanya jika file belum ada**:

```powershell
if (-not (Test-Path -LiteralPath '.env.local')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
```

Buka `.env.local` di editor dan isi:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS="0xALAMAT_KONTRAK_SEPOLIA_ANDA"
SEPOLIA_RPC_URL="https://ENDPOINT_RPC_SEPOLIA_ANDA"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/NAMA_DATABASE?sslmode=require"
```

**Ganti seluruh placeholder di atas.** Alamat kontrak harus alamat Ethereum yang valid, yakni `0x` diikuti 40 karakter heksadesimal. Gunakan alamat yang disalin dari hasil deployment, bukan contoh literal di panduan ini.

| Variabel | Sumber | Akses |
| --- | --- | --- |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Hasil deploy Remix | Publik, tersedia di frontend dan server |
| `SEPOLIA_RPC_URL` | Dashboard penyedia RPC | Server saja |
| `DATABASE_URL` | PostgreSQL/Neon | Server saja |

Ketiga variabel harus terisi dan alamat kontrak harus valid agar aplikasi memilih mode Sepolia. Bila semuanya lengkap tetapi RPC/database gagal, API mengembalikan error; tidak menganggap koneksi tersebut berhasil.

`.env.local` telah dikecualikan oleh `.gitignore`. Periksa tanpa menampilkan isi rahasianya:

```powershell
git check-ignore .env.local
```

Hasil yang diharapkan: `.env.local`. Source control hanya menyimpan template `.env.example`. Restart `npm.cmd run dev` setelah mengubah konfigurasi. Pada build produksi, perubahan `NEXT_PUBLIC_CONTRACT_ADDRESS` memerlukan build/deployment baru.

## 8. Buat tabel database dengan Drizzle

Pastikan `DATABASE_URL` pada `.env.local` menunjuk database yang benar, lalu jalankan:

```powershell
npm.cmd run db:push
```

Konfigurasi [drizzle.config.ts](drizzle.config.ts) memuat environment Next.js, termasuk `.env.local`. Schema aplikasi ada di [src/lib/schema.ts](src/lib/schema.ts). Untuk database baru, perintah akan menyiapkan tabel:

- `users`: alamat wallet, nama, bio, waktu dibuat.
- `campaigns`: ID kampanye on-chain, pembuat, judul, cerita, gambar, kategori, lokasi, nama penggalang, blok pembuatan, dan TxHash pembuatan.

Periksa melalui SQL Editor Neon atau pgAdmin:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'campaigns');
```

Hasil yang diharapkan: dua tabel tersebut. Saldo, total dana, dan status pencairan **tidak** disimpan sebagai sumber kebenaran di database; aplikasi membacanya dari kontrak.

Gunakan satu database untuk satu alamat kontrak. Jika men-deploy kontrak baru, buat database baru dan terapkan schema lagi agar ID kampanye lama tidak bertabrakan. Untuk database yang sudah berisi data, tinjau usulan perubahan schema dan siapkan backup sebelum menerapkannya. Jangan menerima penghapusan data tanpa memahami dampaknya.

## 9. Pastikan mode Sepolia aktif

1. Jalankan ulang website:

   ```powershell
   npm.cmd run dev
   ```

2. Buka **http://localhost:3000/api/campaigns**. Jika konfigurasi valid dan tabel masih kosong, hasilnya:

   ```json
   { "mode": "live", "campaigns": [] }
   ```

3. Bila hasilnya `mode: "demo"`, periksa ketiga environment dan format alamat kontrak.
4. Bila respons `503`, periksa koneksi database, schema, jaringan RPC, dan log terminal server. Hindari membagikan nilai environment saat meminta bantuan.
5. Kembali ke halaman utama. Daftar kosong pada mode Sepolia adalah kondisi normal sebelum membuat kampanye pertama.
6. Jika wallet demo masih terhubung dari percobaan sebelumnya, buka dialog wallet dan **Putuskan koneksi**, lalu pilih **Hubungkan MetaMask**.

## 10. Uji alur kampanye, donasi, dan pencairan

### 10.1 Membuat kampanye dengan wallet A

1. Hubungkan wallet A pada jaringan Sepolia.
2. Klik **Mulai galang dana**.
3. Isi judul (minimal 8 karakter), nama penggalang, lokasi, kategori, target **0.01 ETH**, dan tenggat di masa depan.
4. Isi cerita minimal 40 karakter. URL gambar boleh dikosongkan agar menggunakan gambar bawaan; URL eksternal harus HTTPS.
5. Klik **Terbitkan kampanye di Sepolia**.
6. Konfirmasikan transaksi `createCampaign` melalui MetaMask dan tunggu receipt.
7. Setujui permintaan tanda tangan metadata. Ini berbeda dari transaksi dan tidak memerlukan gas.
8. Kampanye tampil setelah metadata tersimpan. API memeriksa receipt, event kontrak, serta tanda tangan pembuat sebelum menerima metadata.

Verifikasi metadata di database:

```sql
SELECT id, title, creator_address, transaction_hash
FROM campaigns
ORDER BY created_at DESC;
```

Jika transaksi berhasil tetapi metadata gagal tersimpan atau tanda tangan dibatalkan, buka formulir pembuatan lagi dan gunakan **Simpan metadata**. Jangan membuat transaksi kampanye baru untuk mencoba menyimpan cerita yang sama. Draft pemulihan berada di browser asal; gunakan wallet pembuat yang sama.

### 10.2 Berdonasi dengan wallet B

1. Beralih ke wallet B di MetaMask dan hubungkan ulang di website. Saldo B harus cukup untuk donasi dan gas.
2. Buka kampanye wallet A, masukkan **0.01 ETH**, lalu pilih **Donasi sekarang**.
3. Konfirmasikan transaksi di MetaMask.
4. Setelah konfirmasi, periksa jumlah terkumpul dan **Riwayat dukungan**.
5. Buka tautan **Lihat TxHash** menuju Sepolia Etherscan. Hash tersebut berasal dari event blockchain, bukan simulasi.
6. Pastikan wallet B tidak mendapat akses pencairan sebagai pembuat.

### 10.3 Mencairkan dengan wallet A

1. Kembali ke wallet A dan hubungkan ulang.
2. Buka kampanye yang targetnya sudah tercapai.
3. Klik **Cairkan** dan konfirmasikan transaksi.
4. Status kampanye berubah menjadi **Dana telah dicairkan**. Saldo pembuat bertambah sesuai dana diterima dikurangi gas transaksi.
5. Donasi lanjutan serta pencairan kedua ditolak setelah kampanye dicairkan.

**Aturan pendanaan saat ini:** pembuat boleh mencairkan ketika target tercapai **atau** tenggat berakhir. Saat tenggat berakhir, dana tetap boleh dicairkan meskipun target belum terpenuhi. Donasi tidak memiliki mekanisme refund. Penarikan memerlukan dana terkumpul lebih dari nol.

Untuk kasus tenggat, buat kampanye terpisah dengan target lebih besar, donasikan sebagian, lalu tunggu sampai tenggat berakhir. Uji pencairan sebagian dengan wallet pembuat dan penolakan donasi setelah tenggat.

## 11. Jalankan pemeriksaan otomatis dan build

Hentikan server development jika ingin memakai port yang sama untuk server produksi, kemudian jalankan:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

Hasil yang diharapkan:

- TypeScript tidak menampilkan error.
- Empat pengujian utama lulus. Pengujian kontrak mencakup target/tenggat tidak valid, pencatatan donasi, penolakan wallet bukan pembuat, pencairan dini, pencairan pada target, penolakan pencairan berulang, dan pencairan setelah tenggat.
- Build Next.js berhasil.
- Halaman produksi dapat dibuka di **http://localhost:3000**.

`npm.cmd test` menjalankan Ganache di memori lokal; tidak mengirim transaksi ke Sepolia dan tidak memakai saldo wallet Anda. Pada Node.js 24, Ganache dapat menampilkan peringatan binary `uWS` dan menggunakan implementasi Node.js sebagai pengganti. Periksa hasil akhir pengujian; peringatan itu sendiri bukan kegagalan tes.

Pengujian integrasi dengan MetaMask, database milik Anda, dan jaringan Sepolia tetap dilakukan melalui langkah 9–10. Untuk UAT skripsi, simpan hasil pengujian, TxHash, tangkapan layar, serta penilaian pengguna untuk kemudahan koneksi wallet, pembuatan kampanye, donasi, dan transparansi riwayat.

## 12. Deploy website ke Vercel

Kontrak tetap berada di Sepolia dan database tetap berada di PostgreSQL. Deployment Vercel menjalankan frontend Next.js sekaligus API server.

1. Masuk ke [Vercel](https://vercel.com/) dengan akun Anda.
2. Buat project dari Git repository dan pilih **`rendidwi2604/Crowdfunding`**. Jika belum terlihat, atur akses integrasi GitHub untuk repo tersebut.
3. Gunakan branch **`main`**, root directory **`.`**, dan framework **Next.js**.
4. Gunakan Node.js **24.x** jika tersedia. Build command: `npm run build`; install command: `npm ci`. Biarkan output directory pada default Next.js; jangan memakai static export karena proyek memiliki API backend.
5. Sebelum deploy, isi tiga environment berikut. Untuk pemisahan lingkungan, gunakan kontrak/database tersendiri pada Preview.

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_CONTRACT_ADDRESS` | Alamat kontrak Sepolia yang benar |
   | `SEPOLIA_RPC_URL` | HTTPS RPC Sepolia |
   | `DATABASE_URL` | Connection string PostgreSQL yang dapat dijangkau Vercel |

6. Pilih scope **Production**. Isi **Preview** juga bila ingin menjalankan dApp pada preview branch. Jangan menambahkan tanda kutip luar ketika mengisi kolom nilai di dashboard.
7. Pastikan schema sudah diterapkan pada database tersebut melalui langkah 8. Build Vercel tidak menjalankan `db:push` secara otomatis.
8. Jalankan deployment dan buka URL yang diberikan.
9. Periksa `/api/campaigns`, koneksi MetaMask, dan satu alur kampanye kecil pada jaringan Sepolia.

Cara impor dan deployment dijelaskan dalam [dokumentasi deployment Vercel](https://vercel.com/docs/deployments). Environment diatur melalui pengaturan project; setelah mengubah nilainya, lakukan deployment baru agar perubahan diterapkan. Lihat [environment variables Vercel](https://vercel.com/docs/environment-variables).

Jika ingin menampilkan demo online terlebih dahulu, deploy tanpa ketiga variabel tersebut. Untuk beralih ke Sepolia, lengkapi konfigurasi lalu deploy ulang. GitHub Pages tidak menjalankan API server Next.js proyek ini.

## 13. Mengirim perubahan berikutnya ke GitHub

Folder ini menggunakan remote berikut:

```text
origin  https://github.com/rendidwi2604/Crowdfunding.git
```

Untuk perubahan selanjutnya, tinjau daftar perubahan sebelum commit:

```powershell
git status
git diff
git add README.md PANDUAN_KONFIGURASI.md
git commit -m "docs: update configuration guide"
git push origin main
```

Contoh di atas hanya menambahkan dua file dokumentasi. Tambahkan path source yang benar jika Anda mengubah kode. Jika orang lain sudah memperbarui repo, ambil dan integrasikan perubahan terlebih dahulu setelah menyimpan pekerjaan lokal; jangan memakai force push untuk menimpa riwayat.

Jika Git meminta login, selesaikan autentikasi GitHub melalui Git Credential Manager dengan akun yang memiliki akses tulis ke repo. Token tidak perlu dimasukkan ke remote URL atau disimpan dalam source code. GitHub CLI bukan syarat untuk menjalankan proyek ini.

Push ke repo yang sudah terhubung dengan Vercel dapat memulai deployment otomatis sesuai pengaturan project Vercel. Periksa hasil deployment sebelum menganggap perubahan sudah tersedia online.

## 14. Troubleshooting

| Gejala | Pemeriksaan dan tindakan |
| --- | --- |
| `npm.ps1 cannot be loaded` | Gunakan `npm.cmd`, tanpa mengubah kebijakan PowerShell. |
| Port 3000 sudah digunakan | Hentikan server proyek sebelumnya, atau jalankan `npm.cmd run dev -- --port 3001`. |
| Website masih menampilkan demo | Periksa nama ketiga variabel, format alamat kontrak, restart server; untuk produksi lakukan build/deploy ulang. |
| Kampanye kosong setelah mode live | Buat kampanye baru; data demo tidak dimigrasikan ke blockchain. |
| `relation "campaigns" does not exist` | Jalankan `npm.cmd run db:push` pada database yang sama dengan aplikasi. |
| Koneksi PostgreSQL gagal | Periksa host, role, password, database, jaringan, dan pengaturan SSL dari penyedia. Pastikan Vercel tidak menunjuk `localhost`. |
| RPC gagal / jaringan salah | Endpoint harus Sepolia, chain ID `11155111`; cek akses API key dan kuota pada dashboard penyedia. |
| Data dana gagal dibaca | Pastikan alamat berisi kontrak `Crowdfunding` yang benar di Sepolia dan ABI cocok. |
| MetaMask belum ditemukan | Gunakan browser dengan ekstensi MetaMask aktif atau browser dalam aplikasi MetaMask; pilih demo untuk uji tanpa wallet. |
| Jaringan tidak dikenal oleh wallet | Aktifkan test network dan pilih Sepolia di MetaMask, kemudian hubungkan kembali. |
| Akun/jaringan berubah | Aplikasi melepas sesi lama. Klik Hubungkan wallet lagi dengan akun/jaringan yang diinginkan. |
| Saldo tidak cukup | Saldo harus menutup donasi dan gas; ambil tambahan ETH testnet melalui faucet. |
| Permintaan dibatalkan | Coba ulang hanya tindakan yang dibatalkan. Untuk transaksi yang sudah berhasil, periksa receipt sebelum membuat transaksi baru. |
| Transaksi berhasil, cerita belum tersimpan | Perbaiki koneksi database, gunakan browser asal dan wallet pembuat, lalu pilih Simpan metadata pada formulir kampanye. |
| Tombol Cairkan tidak aktif | Pastikan wallet pembuat, dana lebih dari nol, target tercapai atau tenggat lewat, dan belum pernah dicairkan. |
| Riwayat kosong tetapi dana terkumpul ada | Tekan Telusuri transaksi lebih lama; riwayat dipaginasi berdasarkan rentang blok. |
| RPC menolak rentang `eth_getLogs` | Gunakan RPC dengan batas sesuai kebutuhan atau perkecil rentang pada `src/app/api/campaigns/[id]/donations/route.ts`. |
| Alamat kontrak diganti lalu data salah | Gunakan database baru untuk kontrak baru; jangan mencampur metadata dari deployment berbeda. |
| Foto eksternal gagal dimuat | Pastikan URL HTTPS bisa diakses publik; aplikasi menggunakan gambar bawaan sebagai fallback. |

## 15. Checklist selesai

- [ ] Demo berjalan lokal.
- [ ] Wallet A dan B terhubung ke Sepolia dan memiliki ETH testnet.
- [ ] Kontrak dideploy dan alamatnya tercatat.
- [ ] Endpoint RPC menunjuk jaringan Sepolia.
- [ ] `.env.local` lengkap dan tidak dilacak Git.
- [ ] Tabel `users` dan `campaigns` tersedia.
- [ ] `/api/campaigns` mengembalikan `mode: "live"` tanpa error.
- [ ] Pembuatan kampanye selesai sampai tanda tangan dan penyimpanan metadata.
- [ ] Donasi berhasil dan TxHash dapat ditelusuri.
- [ ] Hanya pembuat dapat mencairkan dana sesuai aturan kontrak.
- [ ] Typecheck, tes otomatis, dan build lulus.
- [ ] Environment Vercel lengkap dan deployment sudah diverifikasi.

Source code dan panduan dapat tersedia di GitHub sebelum semua checkbox di atas selesai. Koneksi layanan, deployment kontrak melalui wallet Anda, dan pengujian jaringan nyata tetap memerlukan konfigurasi akun Anda.
