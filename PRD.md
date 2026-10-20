# Product Requirements Document (PRD)
**Project Name:** Sistem Crowdfunding Berbasis Web3
**Platform:** Web Application (Decentralized Application / dApp)
**Network:** Ethereum Sepolia (Testnet)
**Document Version:** 1.0
**Target Release:** Prototype / Skripsi

---

## 1. Pendahuluan
### 1.1 Latar Belakang
Platform *crowdfunding* konvensional (Web2) masih memiliki kelemahan dalam hal transparansi aliran dana, biaya administrasi pihak ketiga (*payment gateway*), dan potensi manipulasi data (*Single Point of Failure*). Proyek ini bertujuan untuk membangun sistem *crowdfunding* terdesentralisasi (dApp) menggunakan *smart contract* yang memastikan transparansi dan keamanan penggalangan dana secara *peer-to-peer*.

### 1.2 Tujuan Proyek (Objectives)
- Menyediakan platform penggalangan dana tanpa pihak ketiga pengelola keuangan.
- Mencatat seluruh transaksi donasi ke dalam jaringan *blockchain* Ethereum Sepolia yang bersifat *immutable* (tidak bisa diubah) dan *traceable* (bisa dilacak).
- Menghadirkan antarmuka (UI/UX) yang ramah pengguna menggunakan Next.js.
- Menyediakan pencatatan metadata kampanye secara *off-chain* menggunakan PostgreSQL agar *load* aplikasi tetap cepat dan biaya gas (*Gas Fee*) tetap efisien.

---

## 2. Pengguna Sasaran (User Personas)
1. **Penggalang Dana (Campaigner):** Individu atau komunitas yang memiliki dompet kripto (MetaMask) yang membutuhkan pendanaan untuk suatu proyek atau tujuan sosial.
2. **Donatur (Backer/Donator):** Pengguna yang memiliki koin Sepolia ETH dan ingin berdonasi pada kampanye tertentu serta ingin melacak ke mana uang mereka pergi secara *real-time*.

---

## 3. Arsitektur & Teknologi (Tech Stack)
### 3.1 Frontend & Backend (Meta-framework)
- **Framework:** Next.js (App Router / Pages Router)
- **Styling:** TailwindCSS
- **Web3 Integration:** Ethers.js atau Wagmi + Viem (untuk menghubungkan Next.js ke *Smart Contract*).

### 3.2 Blockchain & Smart Contract
- **Bahasa Pemrograman:** Solidity (v0.8.x)
- **Jaringan:** Ethereum Sepolia (Testnet)
- **Wallet Provider:** MetaMask
- **Deployment Tool:** **Remix IDE** (Digunakan untuk *compile*, *testing* awal, dan *deploy* *smart contract* ke jaringan Sepolia secara praktis).

### 3.3 Database (Off-chain Data)
- **Database:** PostgreSQL (Relational Database)
- **ORM:** Prisma ORM atau Drizzle
- **Fungsi:** Menyimpan metadata yang tidak efisien jika disimpan di *blockchain* (seperti profil *user*, deskripsi panjang kampanye, dan tautan gambar/poster), sehingga *database* hanya bertindak sebagai *indexer* dan penyimpan teks.

---

## 4. Kebutuhan Fitur (Feature Requirements)

### Epic 1: Autentikasi Web3
| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F1.1 | *Connect Wallet* | Pengguna dapat *login* dengan menghubungkan MetaMask. Tidak perlu registrasi *email/password*. | Tinggi |
| F1.2 | *Display Address & Balance* | Menampilkan alamat *wallet* (terpotong, misal: 0x123...abc) dan saldo Sepolia ETH pengguna di *header*. | Tinggi |

### Epic 2: Pengelolaan Kampanye (Campaign Management)
| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F2.1 | *Create Campaign* | Pengguna menginput Judul, Deskripsi, Target ETH, dan *Deadline*. *Trigger smart contract* untuk membuat *instance* kampanye baru. | Tinggi |
| F2.2 | *Explore Campaigns* | Menampilkan daftar kampanye aktif (diambil dari PostgreSQL untuk deskripsi/gambar, dan dari *Blockchain* untuk jumlah donasi terkini). | Tinggi |
| F2.3 | *Campaign Detail* | Halaman detail kampanye yang menampilkan target dana, dana terkumpul, sisa waktu, dan tombol donasi. | Tinggi |

### Epic 3: Transaksi & Pendanaan (Funding)
| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F3.1 | *Donate to Campaign* | Donatur memasukkan jumlah Sepolia ETH dan menekan tombol donasi. MetaMask akan muncul untuk konfirmasi *Gas Fee* dan transaksi. | Tinggi |
| F3.2 | *Transaction History* | Menampilkan daftar donatur pada kampanye tersebut, lengkap beserta TxHash yang bisa diklik menuju Sepolia Etherscan. | Tinggi |

### Epic 4: Pencairan Dana (Withdrawal)
| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F4.1 | *Withdraw Funds* | Tombol pencairan hanya bisa diakses dan dieksekusi oleh *wallet address* si pembuat kampanye. | Tinggi |

---

## 5. Spesifikasi Smart Contract (Solidity)
Kontrak utama `Crowdfunding.sol` akan dideploy menggunakan **Remix IDE**.
**Fungsi Utama:**
1. `createCampaign(uint _target, uint _deadline)`: Membuat kampanye baru.
2. `donateToCampaign(uint _campaignId) payable`: Fungsi menerima kiriman ETH dari donatur.
3. `withdrawFunds(uint _campaignId)`: Mencairkan dana ke *wallet* pembuat kampanye.
4. `getCampaignDetails(uint _campaignId)`: Mengembalikan data target, total terkumpul, alamat pembuat, dan status.

---

## 6. Desain Database Relasional (PostgreSQL)
*Catatan: Transaksi finansial TETAP di *blockchain*. PostgreSQL hanya untuk metadata antarmuka (UI).*

**Table: Users**
- `wallet_address` (Primary Key, String, ex: "0x123...")
- `name` (String)
- `bio` (Text)
- `created_at` (Timestamp)

**Table: Campaigns**
- `id` (Primary Key, berelasi dengan ID kampanye di *smart contract*)
- `creator_address` (Foreign Key -> Users)
- `title` (String)
- `description` (Text)
- `image_url` (String)
- `created_at` (Timestamp)

---

## 7. Rencana Pengujian (Testing Strategy)
Sesuai metodologi skripsi:
1. **White Box Testing:**
   - Melakukan pengujian alur logika pada `Crowdfunding.sol` di **Remix IDE** (memastikan fungsi *withdraw* memiliki percabangan logika yang memblokir penarikan oleh pihak selain pembuat kampanye).
   - Memastikan optimasi penggunaan *Gas Fee* pada setiap *function call*.
2. **Black Box Testing:**
   - Pengujian fungsi UI di Next.js: *Connect wallet*, input form donasi, klik tombol *deploy* kampanye, dan memastikan data masuk ke PostgreSQL sekaligus tercatat di Sepolia.
3. **User Acceptance Testing (UAT):**
   - Menggunakan Kuesioner dengan metode **Skala Likert** kepada responden untuk menilai tingkat kemudahan (*usability*) dan transparansi sistem.

---

## 8. Infrastruktur & Deployment
1. **Smart Contract:** Di-compile dan di-deploy ke jaringan **Sepolia** menggunakan **Remix IDE** melalui *injected provider* (MetaMask).
2. **Frontend & Backend (Next.js):** Di-deploy menggunakan **Vercel** (opsi paling stabil untuk Next.js).
3. **Database (PostgreSQL):** Dapat menggunakan layanan *cloud* gratis seperti **Supabase**, **Neon DB**, atau **Vercel Postgres**.