# Pengiriman produk digital yang aman (tanpa langkah Supabase)

Pembeli hanya bisa mengunduh setelah pesanan berstatus `paid`. Lokasi file rahasia dan tidak pernah dikirim ke browser.

## Cara kerjanya

1. Saat checkout, browser pembeli membuat token acak. Yang disimpan di pesanan hanya hash SHA-256 token (`data.access_token_hash`). Token asli ada di URL halaman pembayaran (`?t=`) dan di penyimpanan lokal browser pembeli.
2. Setelah pesanan `paid` (otomatis lewat webhook GoPay atau manual lewat persetujuan admin), halaman pembayaran memanggil `POST /api/order-download`.
3. Fungsi Vercel memeriksa hash token dan status `paid`, lalu mengambil file dari lokasi rahasia di `DIGITAL_FILES` dan mengirimkannya sebagai unduhan.

Tidak ada migrasi database dan tidak ada edge function.

## Setup (sekali per produk)

1. **Simpan file di tempat yang URL-nya tidak bisa ditebak.** Pilihan yang sesuai dengan Vercel: Vercel Dashboard, Storage, Create, Blob, lalu unggah PDF. Salin URL file.
2. **Catat id produk.** Untuk modul Affiliate Marketing id-nya `9ee3e0ba-68af-4936-8217-b38d524d0082`.
3. **Tambahkan environment variable** di Vercel (Production) bernama `DIGITAL_FILES`:

```json
{"9ee3e0ba-68af-4936-8217-b38d524d0082":{"url":"https://URL-FILE-KAMU.pdf","filename":"Affiliate-Marketing-Panduan-Lengkap.pdf"}}
```

   Tandai sebagai Sensitive. Jangan menaruh URL ini di kode atau repo karena repo publik.
4. **Redeploy** agar variabel terbaca.

## Menambah produk digital lain

Tambahkan satu entri lagi di JSON `DIGITAL_FILES` dengan id produk sebagai kunci, lalu redeploy.

## Batasan yang perlu diketahui

- Respons fungsi Vercel dibatasi sekitar 4,5 MB. Cukup untuk PDF biasa. File yang lebih besar butuh pendekatan lain.
- Pesanan yang dibuat sebelum perubahan ini tidak punya hash token, jadi pembelinya dikirimi file secara manual.
- Tidak ada batas jumlah unduhan per pesanan, karena fungsi tidak menulis ke database. Pembeli yang meneruskan PDF tidak bisa dicegah oleh sistem apa pun, jadi pertimbangkan watermark nama pembeli di PDF kalau itu masalah.
- Jangan mengisi kolom `download_url` di admin produk. Nilainya terbaca publik lewat API.

## Uji

| Uji | Hasil yang diharapkan |
|---|---|
| Halaman pembayaran pesanan belum bayar | Tidak ada tombol unduh |
| Panggil `/api/order-download` dengan token salah | 403 |
| Pesanan uji ditandai `paid` oleh admin, buka tautan dengan `?t=` | Tombol unduh muncul dan file terunduh |
