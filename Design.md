# Web Layout Design Specification

**Design Reference:** `ref.jpg`
**General Theme:** Modern, clean, high-contrast (Dark & Light modes mixed). 
**Primary Colors:** Deep Black/Dark Gray, Pure White, Vibrant Purple (`#5A4FCF` approx), Neon Green (`#39FF14` approx).

---

## 1. Header / Navigation Bar
**Theme:** Dark Background

*   **Desktop Layout:**
    *   Gunakan Flexbox (`justify-between`, `items-center`).
    *   **Kiri:** Logo & Nama Perusahaan.
    *   **Tengah:** Navigation Links (About, Agenda, Partnership, Testimonial) berjajar horizontal.
    *   **Kanan:** Tombol CTA "Contact Us" (Outlined/White).
*   **Mobile Layout:**
    *   Gunakan Flexbox (`justify-between`, `items-center`).
    *   **Kiri:** Logo & Nama Perusahaan.
    *   **Kanan:** Hamburger Menu Icon (Navigation links disembunyikan dalam drawer atau dropdown saat di-klik). Tombol CTA diletakkan di dalam menu drawer.

## 2. Hero Section
**Theme:** Dark Background

*   **Desktop Layout:**
    *   Gunakan CSS Grid atau Flexbox membagi layar menjadi 2 kolom (50:50).
    *   **Kolom Kiri:** Teks Headline ("Let's come Be Part of Changes" dengan kata "Be Part" warna hijau), Deskripsi singkat, dan dua tombol ("Start here" warna ungu, "Learn More").
    *   **Kolom Kanan:** Komposisi gambar bertumpuk (Absolute positioning / Grid tumpang tindih). Menampilkan foto kegiatan, kartu "Start with email", label "Save The world", dan ikon-ikon dekoratif.
*   **Mobile Layout:**
    *   Berubah menjadi 1 kolom (Stacked/Vertikal).
    *   **Atas:** Teks Headline dan tombol CTA (Rata kiri atau tengah).
    *   **Bawah:** Komposisi gambar disesuaikan skalanya (diperkecil) agar muat dalam lebar layar mobile, diletakkan di bawah teks.

## 3. Impact Section ("More people More impact")
**Theme:** Light Background (Putih/Abu sangat terang)

*   **Desktop Layout:**
    *   **Header Bagian Atas:** Grid 2 kolom. Kiri untuk Judul, Kanan untuk Deskripsi paragraf dan tombol "Read more".
    *   **Konten Bawah:** CSS Grid 3 kolom (`grid-cols-3`). Menampilkan 3 kartu gambar. Kartu pertama memiliki overlay warna ungu dengan teks, kartu kedua dan ketiga berupa foto grayscale.
*   **Mobile Layout:**
    *   Berubah menjadi 1 kolom (Vertikal).
    *   **Header:** Judul di atas, disusul deskripsi di bawahnya, lalu tombol "Read more".
    *   **Konten:** Grid 3 kolom berubah menjadi 1 kolom (`grid-cols-1`). Ketiga kartu gambar berjejer ke bawah (di-scroll secara vertikal).

## 4. Statistics Banner ("Together We Are Strong")
**Theme:** Purple Card on Light Background

*   **Desktop Layout:**
    *   Container full-width (dengan padding). Di dalamnya terdapat Card besar berwarna ungu dengan rounded corners.
    *   Terdapat label hijau di atas judul, dan elemen grafis bintang.
    *   Angka statistik (20k, 20+, 20M) menggunakan Flexbox/Grid 3 kolom berjajar horizontal.
*   **Mobile Layout:**
    *   Card ungu tetap dengan padding yang disesuaikan.
    *   Angka statistik berubah menjadi 1 kolom (berjejer ke bawah) atau dibiarkan horizontal namun dengan ukuran teks yang jauh lebih kecil agar muat (lebih disarankan vertikal/stacked agar mudah dibaca).

## 5. Feature & Join Section ("Almost is never enough")
**Theme:** Light Background

*   **Desktop Layout:**
    *   Grid 2 kolom (50:50).
    *   **Kolom Kiri:** Judul utama, list fitur dengan ikon (Global Community, Crowdfunding), dan deretan avatar kecil dengan tombol "+10k".
    *   **Kolom Kanan:** Gambar besar grayscale (foto relawan) dengan tombol lingkaran ungu "Join Us" yang diposisikan absolute di tengah atau agak ke bawah gambar.
*   **Mobile Layout:**
    *   Berubah menjadi 1 kolom (Vertikal).
    *   **Atas:** Konten teks (Judul, fitur, avatar).
    *   **Bawah:** Gambar relawan beserta tombol "Join Us".

## 6. Testimonial Carousel
**Theme:** Light Background

*   **Desktop Layout:**
    *   **Header:** Teks rata tengah (Center aligned) dengan label hijau di atasnya.
    *   **Konten:** Carousel/Slider. Kartu testimonial aktif menampilkan layout 2 kolom di dalamnya (Kiri: Foto grayscale, Kanan: Kotak ungu berisi teks quote, nama, role). Sebagian kartu berikutnya terlihat di sisi kanan (Overflow-x).
*   **Mobile Layout:**
    *   **Header:** Tetap rata tengah dengan ukuran font lebih kecil.
    *   **Konten:** Kartu testimonial di dalam carousel berubah menjadi vertikal. Foto di bagian atas, kotak teks ungu di bagian bawah foto. Layout carousel menjadi swipeable horizontal (1 kartu per layar).

## 7. Partners / Sponsors
**Theme:** Light Background

*   **Desktop Layout:**
    *   Teks intro kecil rata tengah.
    *   Deretan logo (Amazon, Notion, dll) menggunakan Flexbox (`justify-center` atau `justify-between`) dalam 1 baris horizontal.
*   **Mobile Layout:**
    *   Deretan logo menggunakan CSS Grid 2 atau 3 kolom (`grid-cols-2` atau `grid-cols-3`) agar membungkus (wrap) ke baris baru dan tidak terlalu kecil.

## 8. Footer Section
**Theme:** Dark Background

*   **Desktop Layout:**
    *   **Top CTA:** Flexbox 2 kolom. Kiri: Teks besar "Let's come be part of the changes". Kanan: Tombol ungu besar "Join Us". Terdapat garis pemisah (Divider) di bawahnya.
    *   **Main Footer:** Grid 4 atau 5 kolom.
        *   Kolom 1: Logo, alamat, sosial media icons.
        *   Kolom 2: Sitemap link list.
        *   Kolom 3: Info link list.
        *   Kolom 4: Contact Us (Email, Phone).
    *   **Bottom Bar:** Copyright teks diletakkan dengan flexbox space-between.
*   **Mobile Layout:**
    *   **Top CTA:** Berubah menjadi vertikal. Teks besar di atas, tombol "Join Us" di bawahnya.
    *   **Main Footer:** Grid 4 kolom berubah menjadi 1 kolom penuh. Kolom logo di atas, disusul sitemap, info, dan contact us berderet ke bawah. Opsi lain adalah membuat link list menjadi *accordion* jika ingin menghemat ruang vertikal.
    *   **Bottom Bar:** Teks copyright rata tengah atau bertumpuk vertikal.