# Konteks AI untuk Diagram Draw.io Bab III — RuangBaik

## Tujuan dan penggunaan

File ini menyimpan variabel dan fakta proyek agar GPT, Claude, atau AI lain dapat menggambar diagram tanpa membaca ulang seluruh source code. Ini bukan naskah Bab III dan belum merupakan diagram final.

Berikan file ini kepada AI bersama gambar referensi, lalu sebutkan diagram/subbab yang ingin dibuat. Gambar referensi menentukan bentuk simbol, posisi, arah alur, swimlane, dan gaya visual. Fakta proyek pada file ini menentukan isi diagram yang relevan.

**Analisa sistem berjalan belum ditentukan.** Tunggu gambar referensi dan penjelasan pengguna. Jangan menganggap sistem berjalan memakai transfer bank, admin, spreadsheet, atau prosedur manual tertentu. Jika gambar hanya menunjukkan gaya, proses contoh di dalamnya bukan otomatis fakta objek penelitian.

## Instruksi untuk AI pembuat diagram

```yaml
tujuan: membantu AI memilih variabel dan menggambar sesuai permintaan pengguna
bahasa_label: Indonesia
format_keluaran_saat_diminta: XML draw.io yang bisa diimpor dan diedit (.drawio)
status_saat_ini: menyimpan bahan diagram; menunggu gambar referensi
ruang_lingkup: buat hanya jenis diagram/subbab yang sedang diminta
aturan:
  - Gunakan ID objek pada file ini untuk menjaga konsistensi.
  - Ikuti tata letak dan notasi gambar referensi pengguna.
  - Isi diagram memakai fakta RuangBaik yang relevan, bukan nama objek contoh yang tidak terkait.
  - Jangan menambah aktor, tabel, atribut, atau proses tanpa dasar.
  - Bedakan tabel PostgreSQL, struktur kontrak, event blockchain, dan state halaman.
  - Jika informasi penting belum tersedia, tanyakan bagian itu; jangan mengarang.
  - Keluaran diagram harus berupa objek/konektor draw.io yang dapat diedit, bukan gambar datar.
```

Contoh pesan untuk GPT/Claude, disertai file ini dan gambar referensi:

> Buatkan [JENIS DIAGRAM/SUBBAB] untuk RuangBaik. Gunakan variabel yang relevan dari file konteks ini. Ikuti bentuk dan tata letak gambar referensi yang saya lampirkan. Hasilkan XML draw.io yang dapat diedit. Jika alur sistem berjalan belum dijelaskan, tanyakan informasi yang masih kurang.

## Pemetaan kebutuhan Bab III

| Subbab | Bahan diagram/data |
| --- | --- |
| 3.1 Analisa Sistem | Konteks dan pemisahan sistem berjalan/usulan |
| 3.1.1 Analisa Sistem Berjalan | Menunggu gambar dan keterangan pengguna; belum ada alur baku |
| 3.1.2 Analisa Sistem Usulan | Komponen, aktor, alur F01–F06, aturan B01–B14 |
| 3.2 Perancangan Basis Data | Entitas PostgreSQL dan batas penyimpanan blockchain |
| 3.2.1 ERD | E01, E02, R01 |
| 3.2.2 Transformasi ERD ke LRS | PK pengguna menjadi FK kampanye pada hubungan 1:N |
| 3.2.3 LRS | Record USERS dan CAMPAIGNS |
| 3.2.4 Normalisasi | Candidate key dan ketergantungan fungsional |
| 3.2.5 Spesifikasi Basis Data | Kamus kolom, tipe, kunci, nullable, dan validasi |
| 3.3.1 Use Case Diagram | A01–A06, UC01–UC15 |
| 3.3.2 Activity Diagram | F01–F06, guard, cabang gagal, swimlane |
| 3.3.3 Sequence Diagram | L01–L06, urutan F01–F06, endpoint/fungsi |
| 3.3.4 Class Diagram | CL01–CL13 dan relasi konseptual |

Nomor halaman/gambar, ukuran kertas, warna, font, posisi objek, dan jumlah halaman diagram mengikuti referensi/pedoman pengguna nanti.

## 1. Konteks aplikasi

```yaml
nama: RuangBaik
fungsi: crowdfunding berbasis web dan smart contract
frontend: Next.js dan React
backend: API Next.js
database: PostgreSQL melalui Drizzle
wallet: MetaMask
blockchain: Ethereum Sepolia
chain_id: 11155111
mata_uang: ETH testnet
penjelajah_transaksi: Sepolia Etherscan
smart_contract: Crowdfunding

sistem_berjalan:
  status: belum ditentukan
  aktor: menunggu penjelasan/gambar pengguna
  aktivitas: menunggu penjelasan/gambar pengguna
  dokumen_masukan_keluaran: belum ditentukan
  masalah: harus berasal dari keterangan/hasil penelitian pengguna

sistem_usulan:
  konteks: implementasi RuangBaik pada file ini
  mode_demo: tidak ada
  localStorage: tidak digunakan
  admin: tidak ada
  login_email_password: tidak ada
  persetujuan_kampanye_oleh_admin: tidak ada
  pembayaran_fiat: tidak ada
  refund: tidak ada
  kolom_role_di_database: tidak ada
```

Satu wallet dapat menjadi donatur sekaligus penggalang. Signature membuktikan penguasaan address, bukan legalitas organisasi. Donasi/pencairan tidak disimpan sebagai tabel SQL. Profil, metadata, dan state halaman tidak boleh disamakan dengan saldo/event blockchain.

## 2. Komponen dan aktor

| ID | Komponen | Peran |
| --- | --- | --- |
| C01 | Antarmuka RuangBaik | Formulir, daftar/detail kampanye, dashboard, interaksi wallet |
| C02 | API RuangBaik | Validasi, verifikasi receipt/signature, database dan riwayat |
| C03 | PostgreSQL | Profil wallet dan metadata kampanye |
| C04 | MetaMask | Akun, jaringan, signature, persetujuan transaksi |
| C05 | Ethereum Sepolia / Crowdfunding | Eksekusi kontrak, pendanaan, receipt, event |
| C06 | Sepolia Etherscan | Tujuan tautan address/TxHash |

| ID | Aktor | Akses/peran |
| --- | --- | --- |
| A01 | Pengunjung | Membaca kampanye, pencarian/filter, riwayat, bookmark sementara, bahasa |
| A02 | Pengguna Wallet | Pengunjung terhubung wallet; profil dan dashboard |
| A03 | Donatur | Pengguna wallet yang memberikan donasi |
| A04 | Penggalang Dana | Pengguna wallet yang membuat/mencairkan kampanye miliknya |
| A05 | MetaMask | Aktor sistem pendukung |
| A06 | Ethereum Sepolia | Aktor sistem pendukung yang menjalankan kontrak |

Batas use case: **Aplikasi Web RuangBaik = antarmuka + API**. MetaMask dan Sepolia di luar batas; PostgreSQL penyimpanan internal, bukan aktor manusia. Etherscan boleh menjadi aktor sistem eksternal bila tautan penelusuran digambar.

Generalisasi opsional: A02 mewarisi A01; A03 dan A04 mewarisi A02. Kepala panah menuju aktor yang lebih umum. Peran donatur/penggalang tidak saling eksklusif.

## 3. Variabel ERD, LRS, dan spesifikasi PostgreSQL

### E01 — USERS

Tabel fisik: `users`. Ekspor schema kode: `users`.

| Kolom SQL | Atribut kode | Tipe SQL | Kunci | NULL | Makna/validasi aplikasi |
| --- | --- | --- | --- | --- | --- |
| wallet_address | walletAddress | text | PK | Tidak | Address Ethereum; API menormalkan lowercase |
| name | name | text | — | Tidak | Profil 3–100 karakter; record otomatis dari organizer kampanye memakai batas 2–100 |
| bio | bio | text | — | Ya | Maksimal 500 karakter; profil kosong menjadi NULL |
| created_at | createdAt | timestamp | — | Tidak | Default now(); waktu record database dibuat |

### E02 — CAMPAIGNS

Tabel fisik: `campaigns`. Ekspor schema kode: `campaignMetadata`.

| Kolom SQL | Atribut kode | Tipe SQL | Kunci | NULL | Makna/validasi aplikasi |
| --- | --- | --- | --- | --- | --- |
| id | id | text | PK | Tidak | ID kontrak sebagai string desimal; ID pertama dapat bernilai 0 |
| creator_address | creatorAddress | text | FK | Tidak | Mengacu users.wallet_address; creator dari event kontrak |
| title | title | text | — | Tidak | Judul 8–120 karakter |
| description | description | text | — | Tidak | Cerita 40–10.000 karakter |
| image_url | imageUrl | text | — | Tidak | URL HTTPS/path gambar bawaan/data URL base64 |
| category | category | text | — | Tidak | Lingkungan, Pendidikan, Kemanusiaan, Kesehatan |
| location | location | text | — | Tidak | Lokasi 2–100 karakter |
| organizer | organizer | text | — | Tidak | Nama penggalang khusus kampanye, 2–100 karakter |
| creation_block | creationBlock | integer | — | Tidak | Nomor blok receipt; awal penelusuran event |
| transaction_hash | transactionHash | text | UQ | Tidak | TxHash pembuatan; input 0x diikuti 64 karakter heksadesimal |
| created_at | createdAt | timestamp | — | Tidak | Default now(); waktu metadata tersimpan |

Batas karakter di atas adalah validasi aplikasi, bukan deklarasi VARCHAR SQL. `category` bukan tabel master. Upload JPEG/PNG/WebP maksimal 1 MB disimpan sebagai data URL pada `image_url`; URL eksternal maksimal 2.000 karakter. Tidak ada tabel gambar/IPFS.

### Relasi dan transformasi

```yaml
R01:
  sumber: users.wallet_address
  tujuan: campaigns.creator_address
  nama: membuat/memiliki
  jenis: one-to-many
  kampanye_per_pengguna: 0..N
  pengguna_pembuat_per_kampanye: tepat 1
  partisipasi_kampanye: wajib
  tabel_penghubung: tidak diperlukan

LRS:
  USERS: [wallet_address(PK), name, bio, created_at]
  CAMPAIGNS: [id(PK), creator_address(FK), title, description, image_url,
              category, location, organizer, creation_block,
              transaction_hash(UQ), created_at]
  transformasi: PK sisi USERS menjadi FK pada sisi CAMPAIGNS
```

### Variabel normalisasi

```text
Candidate key USERS: wallet_address
Candidate key CAMPAIGNS: id; transaction_hash

wallet_address -> name, bio, users.created_at
id -> creator_address, title, description, image_url, category,
      location, organizer, creation_block, transaction_hash, campaigns.created_at
transaction_hash -> id

UNF: ilustrasi pengguna dengan kelompok kampanye berulang, bukan hasil pengamatan database lama.
1NF: nilai atribut tunggal; kelompok kampanye berulang dipisah menjadi record tersendiri.
2NF: candidate key berupa atribut tunggal; tidak ada ketergantungan parsial pada key gabungan.
3NF: identitas umum pengguna dipisah dari informasi khusus kampanye.
```

Penjelasan 3NF mengikuti ketergantungan tersebut. `users.name` adalah nama profil terkini; `campaigns.organizer` adalah nama penggalang dalam kampanye. Jangan menganggap keduanya selalu sama atau menetapkan `creator_address -> organizer`. Jangan menormalisasi event blockchain sebagai tabel SQL.

## 4. Variabel blockchain dan aturan keputusan

```yaml
penyimpanan_kontrak:
  campaigns: mapping(uint256 => Campaign)
  campaignCount: uint256
  locked: bool untuk guard reentrancy, bukan status kampanye

Campaign:
  creator: address
  target: uint256 dalam wei
  deadline: uint256 Unix timestamp detik
  raised: uint256 total donasi kumulatif dalam wei
  withdrawn: uint256 total pencairan kumulatif dalam wei

fungsi:
  createCampaign: "createCampaign(uint256 target, uint256 deadline) -> uint256 id"
  donateToCampaign: "donateToCampaign(uint256 id), payable"
  withdrawFunds: "withdrawFunds(uint256 id, uint256 amount)"
  getCampaignDetails: "getCampaignDetails(uint256 id) -> creator, target, deadline, raised, withdrawn"

event:
  CampaignCreated: [campaignId, creator, target, deadline]
  DonationReceived: [campaignId, donor, amount, timestamp]
  FundsWithdrawn: [campaignId, creator, amount, totalWithdrawn, timestamp]
```

TxHash berasal dari log/receipt, bukan parameter event. `CampaignCreated` tidak mempunyai parameter timestamp. Kontrak memakai wei; UI/API mengubah ke string ETH. ID Solidity `uint256` dipetakan ke string pada database/API. Database saat ini untuk satu deployment kontrak; tidak ada kolom chain_id/contract_address.

| ID | Guard/aturan |
| --- | --- |
| B01 | ID valid jika id < campaignCount; saat dibuat target > 0 dan deadline > block.timestamp |
| B02 | Nominal formulir > 0, maksimal 1.000.000 ETH, maksimal 18 angka desimal |
| B03 | Formulir pembuatan mensyaratkan deadline lebih dari 60 detik ke depan |
| B04 | Donasi: block.timestamp < deadline DAN msg.value > 0 |
| B05 | Pencairan: caller == creator DAN (raised >= target ATAU block.timestamp >= deadline) |
| B06 | Nominal pencairan > 0 DAN <= raised - withdrawn |
| B07 | Saldo tersedia = raised - withdrawn; pencairan menambah withdrawn, bukan mengurangi raised |
| B08 | Pencairan bertahap diperbolehkan; donasi tetap boleh sebelum tenggat meskipun target tercapai/pernah dicairkan |
| B09 | Target tidak tercapai tetap boleh dicairkan setelah tenggat; tidak ada refund |
| B10 | Publikasi metadata: receipt sukses, tujuan kontrak cocok, event pembuatan ada, signer sesuai creator |
| B11 | Publikasi metadata membuat users jika belum ada; profil terpisah bukan syarat membuat kampanye |
| B12 | Kampanye tanpa metadata PostgreSQL belum tampil pada daftar aplikasi |
| B13 | Signature profil/metadata bukan transaksi ETH dan tidak memerlukan gas |
| B14 | Koneksi/konfigurasi gagal menampilkan kesalahan dan muat ulang, bukan data demo |

## 5. Variabel use case

| ID | Label use case | Aktor utama | Pendukung |
| --- | --- | --- | --- |
| UC01 | Melihat daftar kampanye | A01 | A06 |
| UC02 | Mencari dan memfilter kampanye | A01 | — |
| UC03 | Melihat detail kampanye | A01 | — |
| UC04 | Menghubungkan/mengganti akun wallet | A01 | A05 |
| UC05 | Mendaftarkan/memperbarui identitas wallet | A02 | A05 |
| UC06 | Membuat dan menerbitkan kampanye | A04 | A05, A06 |
| UC07 | Memberikan donasi | A03 | A05, A06 |
| UC08 | Melihat riwayat donasi | A01 | A06 |
| UC09 | Mencairkan dana kampanye | A04 | A05, A06 |
| UC10 | Melihat riwayat pencairan | A01 | A06 |
| UC11 | Melihat aktivitas/kampanye milik wallet | A02 | — |
| UC12 | Menandai kampanye selama tab aktif | A01 | — |
| UC13 | Mengganti bahasa selama tab aktif | A01 | — |
| UC14 | Melanjutkan penyimpanan metadata | A04 | A05, A06 |
| UC15 | Membuka TxHash pada Etherscan | A01 | Etherscan bila ditampilkan |

Relasi opsional: UC14 `extend` UC06 jika penyimpanan gagal setelah transaksi sukses; UC15 `extend` UC08/UC10 saat tautan dipilih. Panah extend menuju use case dasar. Koneksi wallet dapat menjadi prakondisi transaksi; jangan memaksakan include yang berarti selalu menghubungkan ulang wallet.

## 6. Variabel activity dan sequence

### Lifeline/swimlane

| ID | Nama | Peran |
| --- | --- | --- |
| L01 | Pengguna/Donatur/Penggalang | Aktor sesuai skenario |
| L02 | Antarmuka RuangBaik | Boundary |
| L03 | MetaMask | Akun, signature, persetujuan transaksi |
| L04 | Ethereum Sepolia / Crowdfunding | Eksekusi kontrak dan data blockchain |
| L05 | API RuangBaik | Validasi dan koordinasi data |
| L06 | PostgreSQL | Metadata/profil |

Gunakan lifeline yang terlibat saja. Untuk activity, nama tersebut dapat menjadi swimlane. Alur berikut menjadi bahan pesan/node; tata letak menunggu gambar referensi.

### F01 — Hubungkan wallet / UC04

```text
Pengguna -> UI: klik Hubungkan MetaMask
UI: periksa MetaMask tersedia
UI -> MetaMask: wallet_requestPermissions untuk pemilihan akun
UI -> MetaMask: eth_accounts dan eth_chainId
[jaringan berbeda] UI -> MetaMask: wallet_switchEthereumChain ke Sepolia
UI -> MetaMask: ambil signer/address dan saldo
UI -> Pengguna: wallet terhubung
Gagal: wallet tidak tersedia, izin ditolak, akun kosong, pergantian jaringan gagal
Perubahan akun/jaringan: hapus state wallet dan minta koneksi ulang
```

### F02 — Simpan identitas wallet / UC05

```text
Pengguna -> UI: nama, bio
UI: validasi nama/bio dan wallet
UI -> MetaMask: signMessage(profileMessage(address, name, bio))
MetaMask -> UI: signature
UI -> API: POST /api/profiles {address, name, bio, signature}
API: validasi dan verifyMessage; signer harus cocok dengan address
API -> PostgreSQL: insert/upsert users
API -> UI -> Pengguna: hasil penyimpanan
Gagal: input invalid, signature ditolak/tidak cocok, database gagal
Tidak ada transaksi kontrak pada penyimpanan profil
```

### F03 — Membuat kampanye / UC06 dan UC14

```text
Penggalang -> UI: title, description, category, image, location, organizer, target, deadline
UI: periksa wallet/koneksi dan validasi formulir
UI -> MetaMask: persetujuan createCampaign(targetWei, deadlineSeconds)
MetaMask -> Sepolia: transaksi createCampaign
Sepolia: simpan Campaign dan emit CampaignCreated
Sepolia -> MetaMask -> UI: receipt sukses dan TxHash
UI: simpan PendingCampaign sementara di state tab
UI -> MetaMask: signMessage(metadataMessage(transactionHash, metadata, contract))
MetaMask -> UI: signature
UI -> API: POST /api/campaigns {transactionHash, metadata, signature}
API -> Sepolia: getTransactionReceipt(transactionHash)
API: periksa receipt.status, receipt.to, CampaignCreated, dan signer
API -> PostgreSQL: transaksi insert users jika belum ada dan insert campaigns jika belum ada
API -> UI: ID kampanye
UI: hapus pending dan muat ulang daftar
UI -> Penggalang: kampanye terbit
Gagal sebelum receipt sukses: tampilkan kesalahan
Gagal sesudah receipt sukses: ulangi signature/POST metadata di tab sama, tanpa createCampaign baru
```

`PendingCampaign = {transactionHash, metadata, address}` berada di state tab, tidak pulih dari localStorage sesudah refresh/menutup halaman. Pesan signature metadata mengikat chain ID, kontrak, TxHash, dan hash isi metadata.

### F04 — Donasi / UC07

```text
Donatur -> UI: pilih kampanye dan nominal
UI: validasi wallet, nominal, saldo, tenggat
UI -> MetaMask: persetujuan donateToCampaign(id, {value: amountWei})
MetaMask -> Sepolia: transaksi donasi
Sepolia: validasi B04; raised += msg.value; emit DonationReceived
Sepolia -> MetaMask -> UI: receipt
UI -> API: GET /api/campaigns
API -> PostgreSQL: baca metadata
API -> Sepolia: getCampaignDetails(id)
API -> UI: data kampanye gabungan
UI -> MetaMask: baca saldo terbaru
UI -> Donatur: hasil donasi dan riwayat
Gagal: nominal/saldo/gas tidak cukup, tenggat lewat, persetujuan ditolak, transaksi gagal
```

Tidak ada insert donasi ke PostgreSQL atau endpoint POST donasi. Pembacaan riwayat memakai F06.

### F05 — Pencairan / UC09

```text
Penggalang -> UI: buka kampanye sendiri dan isi nominal
UI: periksa pemilik, raised, withdrawn, target, deadline, nominal
UI -> MetaMask: persetujuan withdrawFunds(id, amountWei)
MetaMask -> Sepolia: transaksi pencairan
Sepolia: validasi B05/B06; withdrawn += amount; transfer ETH ke creator; emit FundsWithdrawn
Sepolia -> MetaMask -> UI: receipt
UI -> API: GET /api/campaigns
API -> PostgreSQL dan Sepolia: baca metadata dan nilai kontrak
API -> UI: data terbaru
UI -> MetaMask: baca saldo terbaru
UI -> Penggalang: hasil pencairan
Gagal: bukan creator, belum layak cair, nominal berlebih, transaksi ditolak, transfer gagal
```

Transfer ETH menuju address creator, bukan API/PostgreSQL. Revert membatalkan perubahan transaksi.

### F06 — Riwayat donasi/pencairan / UC08 dan UC10

```text
Pengunjung -> UI: pilih tab riwayat
UI -> API: GET /api/campaigns/{id}/donations atau /withdrawals
API: validasi id dan cursor jika diberikan
API -> PostgreSQL: cari campaigns.id dan creation_block
API -> Sepolia: getBlockNumber(), queryFilter(event kampanye, fromBlock, toBlock)
Sepolia -> API: event logs
API: bentuk address, amount, hash, date; pencairan juga totalWithdrawn
API -> UI: donations/withdrawals dan nextCursor
UI -> Pengunjung: riwayat, keadaan kosong, atau pesan kesalahan
[opsional] Pengunjung -> Etherscan: buka TxHash
Gagal: id invalid, kampanye tidak ditemukan, database/RPC gagal
```

Satu permintaan maksimal 5.000 blok. API mendukung `nextCursor`, tetapi UI saat ini meminta rentang awal; jangan menggambar pemuatan seluruh riwayat otomatis sebagai fitur yang sudah ada.

## 7. Variabel class diagram

Model bersifat konseptual. Implementasi memakai komponen/fungsi React dan modul API; nama control berikut bukan klaim adanya class TypeScript bernama sama.

| ID | Nama/stereotype | Atribut/operasi |
| --- | --- | --- |
| CL01 | User, entity | Semua atribut E01 |
| CL02 | CampaignMetadata, entity | Semua atribut E02 |
| CL03 | OnchainCampaign, struct | creator, target, deadline, raised, withdrawn |
| CL04 | DonationEvent, event projection | campaignId, donor, amount, timestamp, transactionHash; TxHash dari log |
| CL05 | WithdrawalEvent, event projection | campaignId, creator, amount, totalWithdrawn, timestamp, transactionHash |
| CL06 | WalletState, view model | address: string; balance: string ETH |
| CL07 | PendingCampaign, view model | transactionHash: string; metadata; address: string |
| CL08 | WalletGateway, module | connectWallet(selectAccount); writeContract(expectedAddress); walletAccount(provider, selectAccount) |
| CL09 | CampaignApplication, control | campaigns, wallet, pending, bookmarks; refresh(); createCampaign(form); saveMetadata(draft); donate(c, amount); withdraw(c, amount); saveProfile(form); updateBalance() |
| CL10 | CampaignAPI, control | GET/POST /api/campaigns |
| CL11 | ProfileAPI, control | GET /api/profiles?address=...; POST /api/profiles |
| CL12 | HistoryAPI, control | GET /api/campaigns/{id}/donations; GET /api/campaigns/{id}/withdrawals |
| CL13 | Crowdfunding, smart contract | campaigns, campaignCount, locked; createCampaign(); donateToCampaign(); withdrawFunds(); getCampaignDetails() |

```text
CL01 [1] -- [0..N] CL02 : membuat/memiliki
CL02 [0..1] -- [1] CL03 : metadata untuk kampanye on-chain
CL13 [1] *-- [0..N] CL03 : menyimpan struct dalam mapping
CL03 [1] -- [0..N] CL04 : riwayat donasi melalui campaignId
CL03 [1] -- [0..N] CL05 : riwayat pencairan melalui campaignId
CL09 ..> CL06, CL07 : menggunakan state opsional
CL09 ..> CL08, CL10, CL11, CL12 : dependency
CL08 ..> CL13 : akses provider/signer
CL10 ..> CL01, CL02, CL13 : metadata dan data kontrak
CL11 ..> CL01 : profil
CL12 ..> CL02, CL04, CL05 : creationBlock dan event
```

Setiap metadata merujuk satu kampanye on-chain; kampanye on-chain dapat belum mempunyai metadata. Hubungan berlaku dalam satu deployment kontrak. Relasi event bukan FK SQL dan bukan tabel anak PostgreSQL.

## 8. Sumber fakta untuk pemeriksaan ulang

```text
src/lib/schema.ts                              -> tabel, kolom, kunci, nullable
contracts/Crowdfunding.sol                      -> struct, fungsi, event, aturan transaksi
src/lib/campaigns.ts                           -> tipe dan validasi data
src/lib/images.ts                              -> gambar dan data URL
src/lib/contract.ts                            -> jaringan, wallet, ABI
src/lib/wallet.ts                              -> izin/pemilihan akun wallet
src/lib/signature.ts                           -> pesan signature
src/app/api/campaigns/route.ts                  -> baca/gabung dan publikasi metadata
src/app/api/profiles/route.ts                   -> profil wallet
src/app/api/campaigns/[id]/donations/route.ts    -> event donasi/cursor
src/app/api/campaigns/[id]/withdrawals/route.ts  -> event pencairan/cursor
src/components/ruangbaik.tsx                    -> state dan alur antarmuka
```

Dokumen tidak menyimpan password, private key, connection string database, atau API key. Kebutuhan visual dan informasi sistem berjalan ditambahkan setelah pengguna mengirim referensi, tetap dalam file yang sama.
