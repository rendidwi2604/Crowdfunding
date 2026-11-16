# Perancangan basis data hybrid RuangBaik

Buka `RuangBaik_Perancangan_Basis_Data_Hybrid.drawio` di aplikasi draw.io/diagrams.net melalui **File → Open From → Device**. File ini berisi tiga halaman yang dapat diedit:

1. **3.2.1 ERD**: kotak entitas dan belah ketupat relasi mengikuti gambar referensi. Atribut ditampilkan di luar kotak entitas. Bagian blockchain merupakan perluasan konseptual ERD, bukan tambahan tabel SQL.
2. **3.2.2 Transformasi ERD ke LRS**: batas kelompok putus-putus mengikuti referensi. PK `USERS.wallet_address` menjadi FK `CAMPAIGNS.creator_address` di sisi banyak. Tidak dibentuk tabel penghubung. Atribut lainnya dipertahankan; daftar lengkap ada di halaman LRS.
3. **3.2.3 LRS**: kotak record dengan kepala nama dan daftar atribut mengikuti referensi. Bagian off-chain hanya memuat dua record SQL; bagian on-chain menampilkan struct dan event dengan penanda khusus.

Tersedia pula file `.drawio` terpisah, SVG untuk ekspor vektor, serta PNG untuk dimasukkan ke naskah. Semua diagram memakai objek dan konektor native draw.io, bukan gambar yang ditempel ke kanvas. Nomor subbab mengikuti PRD, bukan nomor pada contoh gambar.

## Arti model hybrid

- **Off-chain:** tabel `users` dan `campaigns` pada PostgreSQL/Neon, sesuai `src/lib/schema.ts`.
- **On-chain:** `campaigns: mapping(uint256 => Campaign)` dan event `CampaignCreated`, `DonationReceived`, serta `FundsWithdrawn`, sesuai `contracts/Crowdfunding.sol`.
- Relasi SQL R01 adalah 1 pengguna ke 0..N kampanye. Setiap kampanye memiliki tepat satu pengguna pembuat.
- Tautan aplikasi `campaigns.id` (text) ke `campaignId` (uint256) ditandai konektor putus-putus. Setiap metadata merujuk satu kampanye on-chain; kampanye on-chain dapat belum memiliki metadata. Tautan ini bukan FK SQL dan berlaku untuk satu deployment kontrak.
- `campaignId` adalah kunci mapping, bukan anggota struct Solidity. Anggota struct hanya `creator`, `target`, `deadline`, `raised`, dan `withdrawn`.
- Event donasi dan pencairan memiliki kardinalitas 0..N per kampanye. Event pembuatan memiliki kardinalitas tepat satu per kampanye. Hubungan ini merupakan asosiasi log blockchain, bukan relasi tabel SQL.
- `transactionHash` berasal dari log/receipt, bukan parameter event. `creation_block` dan `transaction_hash` pada SQL menunjuk transaksi pembuatan kampanye.
- Identitas donor/creator pada event merupakan address blockchain; tidak mensyaratkan profil pengguna pada PostgreSQL. Tidak ada FK event ke tabel `users`.
- `campaignCount` dan `locked` merupakan state tingkat kontrak, bukan atribut kampanye atau record SQL, sehingga tidak dimasukkan sebagai entitas.
- Bingkai putus-putus menunjukkan kelompok penyimpanan/transformasi. Konektor putus-putus menunjukkan tautan lintas penyimpanan.

Sumber: `PRD_BAB_3.md` (bagian 3, 4, dan 7), `src/lib/schema.ts`, dan `contracts/Crowdfunding.sol`. Diagram tidak mengubah source aplikasi atau database.

## Membuat ulang ekspor

Jalankan `node diagrams/generate-diagrams.cjs` dari root proyek. Generator menggunakan `sharp` yang sudah tersedia pada dependensi proyek untuk membuat pratinjau PNG dari SVG. Bila diagram diedit langsung di draw.io, simpan hasilnya; menjalankan generator kembali akan menimpa file diagram dan ekspor dengan model generator.
