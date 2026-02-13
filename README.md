# 💰 Money Tracker Pro (v4.2.0-Stable)

**Money Tracker Pro** adalah aplikasi pencatatan keuangan berbasis web
(*Web App*) yang berjalan di ekosistem Google (**Google Apps Script** &
**Google Sheets**).

Aplikasi ini dirancang sebagai solusi manajemen keuangan yang **praktis,
gratis, aman**, dan sepenuhnya **privat** karena database tersimpan di
Google Drive milik pengguna sendiri.

Dikembangkan dengan pendekatan **Mobile-First**, aplikasi ini
menghadirkan pengalaman pengguna setara aplikasi native dengan fitur
interaktif seperti **Slide-to-Action** dan visualisasi data
**real-time**.

------------------------------------------------------------------------

## ✨ Fitur Utama

-   ⚡ **Pencatatan Cepat**\
    Input pemasukan, pengeluaran, dan transfer antar dompet dengan UI
    responsif.

-   👛 **Multi-Wallet**\
    Kelola saldo dari berbagai sumber (Tunai, Bank, E-Wallet) secara
    terpisah namun terintegrasi.

-   👉 **Slide-to-Action**\
    Geser kartu transaksi ke kiri/kanan untuk Edit atau Hapus data
    (mirip aplikasi native iOS/Android).

-   📊 **Dashboard Statistik**\
    Visualisasi pengeluaran menggunakan *Doughnut Chart* interaktif.

-   🔍 **Filter Canggih**\
    Filter riwayat berdasarkan periode (Mingguan, Bulanan, Tahunan) atau
    tanggal kustom.

-   📁 **Ekspor Data**\
    Unduh laporan keuangan ke format **.CSV** yang kompatibel dengan
    Excel.

-   🔐 **100% Gratis & Privat**\
    Tidak ada biaya langganan, tidak ada iklan, dan data sepenuhnya
    milik pengguna.

------------------------------------------------------------------------

## 🛠️ Spesifikasi Teknis

Sistem dibangun dengan arsitektur **N-Tier Thin Client**.

  -----------------------------------------------------------------------
  Komponen                            Spesifikasi
  ----------------------------------- -----------------------------------
  **Backend Runtime**                 Google Apps Script (GAS) V8 Engine

  **Database**                        Google Sheets API (Flat-File
                                      Relational)

  **Frontend Framework**              Bootstrap 5.3.0 (Responsive
                                      Container Max-Width 480px)

  **Typography**                      Plus Jakarta Sans (Weight 400--800)

  **Charting Engine**                 Chart.js 4.4.1 (Optimized for
                                      Mobile)

  **Touch Interaction**               Native JavaScript Touch Events
                                      (`touchstart`, `touchmove`,
                                      `touchend`)

  **Data Security**                   Input Sanitization (Regex) &
                                      Server-side Validation
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 📂 Struktur Direktori

    /
    ├── backend/
    │   └── Code.gs       # Logika Server-side (CRUD & Kalkulasi)
    ├── frontend/
    │   └── Index.html    # Antarmuka Pengguna (HTML/CSS/JS)
    └── README.md         # Dokumentasi Proyek

------------------------------------------------------------------------

## 🚀 Panduan Instalasi

Tidak perlu instal aplikasi apa pun di HP atau laptop. Cukup pasang di
akun Google Anda.

------------------------------------------------------------------------

### ✅ Langkah 1: Persiapan Database

1.  **Buka Google Sheets** dan buat spreadsheet baru.
2.  **Atur Nama Sheet**:
    * Ubah `Sheet1` menjadi: **`Transaksi`**
    * Buat sheet baru bernama: **`Wallets`**
3.  **Atur Header Kolom (Wajib)**:
    Isi baris pertama (**Row 1**) pada masing-masing sheet dengan nama kolom berikut (pastikan ejaan sama persis):

    **Sheet `Transaksi`:**
    | Tanggal | Tipe | Kategori | Wallet | Nominal | Catatan |

    **Sheet `Wallets`:**
    | Nama Wallet | Saldo |

4.  **Isi Data Awal (Opsional)**:
    Pada sheet **Wallets**, Anda bisa mulai memasukkan daftar akun keuangan Anda:
    * **Kolom A**: Nama Dompet (contoh: BCA, Tunai, Gopay)
    * **Kolom B**: Saldo awal (isi dengan angka saja, contoh: `500000`)

------------------------------------------------------------------------

### ✅ Langkah 2 --- Pemasangan Kode

1.  Di Google Sheets → klik **Extensions → Apps Script**.

2.  Hapus kode bawaan:

    ``` javascript
    function myFunction() { }
    ```

3.  Salin isi file:

        backend/Code.gs

    lalu tempel ke editor Apps Script.

4.  Klik **+ (Add File)** → pilih **HTML** → beri nama:

        Index

5.  Salin isi file:

        frontend/Index.html

    lalu tempel ke editor.

6.  Klik **Save (💾)**.

------------------------------------------------------------------------

### ✅ Langkah 3 --- Deployment

1.  Klik **Deploy → New Deployment**.

2.  Pilih **Web App**.

3.  Isi konfigurasi:

    -   **Description**: `Money Tracker Pro v4.2.0`
    -   **Execute as**: Me (email Anda)
    -   **Who has access**:
        -   `Anyone with Google account` (umum)
        -   atau `Only myself` (pribadi)

4.  Klik **Deploy**.

⚠️ **Penting:**\
Saat pertama deploy, Google akan meminta izin akses (**Review
Permissions**). Izinkan akses karena skrip membutuhkan akses ke
spreadsheet Anda sendiri.

5.  Salin **Web App URL** yang muncul --- itu adalah link aplikasi Anda.

------------------------------------------------------------------------

## 🔒 Privasi & Keamanan

### ✅ Tanpa Pihak Ketiga

Kode berjalan sepenuhnya di akun Google Anda. Pengembang tidak memiliki
akses ke data keuangan pengguna.

### ✅ Open Source

Kode transparan dan dapat diaudit langsung. Tidak ada skrip tersembunyi
yang mengirim data ke luar.

------------------------------------------------------------------------

## 📄 Lisensi & Kredit

**Money Tracker Pro v4.2.0-Stable**\
Copyright © 2026 **Bayu Wicaksono**. All Rights Reserved.

Dibuat untuk tujuan penggunaan pribadi guna mempermudah
pencatatan keuangan harian secara gratis.

------------------------------------------------------------------------
