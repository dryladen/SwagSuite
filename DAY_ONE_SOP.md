# 📘 Day One Operational Manual (SOP)

Ini adalah **Panduan Langkah-demi-Langkah** yang harus dilakukan tim Anda saat menggunakan PromoEngine pada **Hari Pertama (Day One)**. Panduan ini dirancang untuk alur kerja "Manual tapi Terstruktur" (sambil menunggu fitur otomatisasi penuh).

---

## 🟢 Alur 1: Sales - Menangani Order Baru

_Penanggung Jawab: Sales Rep_

### 1. Membuat Quote (Penawaran)

1.  Login ke PromoEngine.
2.  Masuk ke menu **Orders** → Klik **+ New Order**.
3.  Pilih **Customer** (atau buat baru di menu Companies jika belum ada).
4.  Masukkan **Project Name** (Contoh: "Coca-Cola Summer Event").
5.  Di bagian **Items**, cari produk (gunakan Universal Search atau S&S Lookup).
6.  Masukkan Harga Jual (Margin akan otomatis dihitung).
7.  Klik **Save as Quote**.

### 2. Mengirim Quote ke Client

> ⚠️ _Karena tombol "Email Client" belum otomatis:_

1.  Buka Quote yang baru dibuat.
2.  (Opsional) Gunakan fitur **Presentation Builder** jika ingin tampilan mewah.
3.  Klik **Export PDF** atau Screenshot tampilan Quote.
4.  Buka Outlook/Gmail Anda secara manual.
5.  Kirim PDF tersebut ke Client dengan Subject: `Quote #1234 - [Nama Project]`.
6.  **PENTING**: Masuk kembali ke PromoEngine, update status order menjadi **"Quote Sent"**.

### 3. Client Setuju (Closing)

1.  Anda menerima email balasan "OK, Lanjut" dari Client.
2.  Buka PromoEngine → Buka Quote tersebut.
3.  Klik tombol **Convert to Sales Order**.
4.  Status otomatis berubah menjadi **Sales Order**.
5.  Notifikasi otomatis (atau manual chat) ke tim Produksi: _"Order #1234 sudah Deal, tolong diproses."_

---

## 🟡 Alur 2: Produksi - Eksekusi Order

_Penanggung Jawab: Production / CSR_

### 1. Memproses PO Vendor

1.  Buka menu **Production Report**.
2.  Lihat kolom **Sales Order Booked**. Kartu baru akan muncul di sana.
3.  Klik kartu tersebut untuk melihat detail item & vendornya.
4.  **Action Manual**: Buat PO ke Vendor (bisa via email manual atau telepon ke Pabrik).
5.  Setelah PO terkirim ke pabrik, geser kartu ke kolom **PO Placed**.
6.  Catat nomor PO Vendor di `internal notes` kartu tersebut.

### 2. Mengelola Proofing (Mockup)

1.  Saat Pabrik mengirim email "Vendor Proof" (Gambar Teknik):
    - Download gambar tersebut.
    - Berikan ke Designer.
2.  Saat Designer memberikan "Client Proof" (Gambar Cantik):
    - Buka Order di PromoEngine → Tab **Files**.
    - Upload file tersebut dengan label `Client_Proof_v1.pdf`.
    - Geser kartu Production ke **Proof Received**.
3.  **Kirim ke Client**:
    - Email manual file tersebut ke Client untuk minta persetujuan.
4.  Saat Client balas "Approve":
    - Geser kartu ke **Proof Approved** / **Order Placed**.
    - Email pabrik: "Jalan Produksi!"

---

## 🔵 Alur 3: Fulfillment - Pengiriman

_Penanggung Jawab: Production / CSR_

### 1. Input Resi (Tracking)

1.  Pabrik menginfokan: _"Barang sudah kirim, ini resi JNE: 123456"_.
2.  Buka kartu di **Production Report**.
3.  Geser ke kolom **Shipped**.
4.  Klik kartu → Isi field **Tracking Number**.
5.  (Penting) Email Client manual: _"Barang sudah jalan ya, ini resinya."_

### 2. Selesai (Closing)

1.  Barang sampai diterima Client.
2.  Masuk ke menu **Orders**.
3.  Ubah status menjadi **Delivered** atau **Closed**.
4.  Sales Rep boleh mulai follow-up untuk minta testimoni ("Gimana barangnya? Aman?").

---

## 📝 Daily Routine (Rutinitas Harian)

Setiap pagi, tim harus melakukan ini:

1.  **Sales**: Cek menu **Orders**, filter status `Quote Sent`. Follow-up client yang belum balas.
2.  **Production**: Cek menu **Production Report**.
    - Adakah kartu yang "mandek" di kolom `Proof Received` lebih dari 2 hari? (Artinya client belum approve).
    - Adakah kartu di `Order Placed` yang sudah lewat tanggal estimasi? (Telepon pabrik).
3.  **Manager**: Cek Dashboard utama untuk melihat "Total Revenue" bulan ini.
