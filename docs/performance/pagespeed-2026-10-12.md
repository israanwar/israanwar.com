# Performa — 12 Oktober 2026

Status: kandidat di branch `perf/pagespeed-100`, belum dirilis. **Target Google PageSpeed 100 mobile dan desktop belum terbukti tercapai**; angka di bawah adalah Lighthouse 13.5 lokal, bukan hasil Google produksi.

## Dasar

Laporan Google 12 Oktober 10.58 WIB untuk `7dd7a17`: [mobile](https://pagespeed.web.dev/analysis/https-www-israanwar-com/u17j482qpc?form_factor=mobile), [desktop](https://pagespeed.web.dev/analysis/https-www-israanwar-com/u17j482qpc?form_factor=desktop).

| Mode | Performa | TBT | LCP | CLS | Speed Index |
|---|---:|---:|---:|---:|---:|
| Mobile | 65 | 1.640 ms | 1,7 s | 0 | 8,0 s |
| Desktop | 66 | 1.320 ms | 0,4 s | 0,003 | 2,2 s |

LCP, FCP dan CLS sudah baik. Hambatan adalah TBT: evaluasi script 2,7 s, task panjang tanpa atribusi `_lighthouse-eval.js` 1.437 ms/1.120 ms yang berdekatan dengan task `show_ads_impl`/`adsbygoogle`/`sodar2`, serta dua forced reflow 74 ms dari script inline di `index.html` (handler `pageshow`).

## Perubahan

- Script AdSense dimuat setelah input pertama (pointerdown, keydown, wheel), bukan saat idle. Kandidat dari `ads-after-interaction-candidate.diff`, kini diterapkan di `scripts/public-delivery.mjs`. Iklan tetap Auto ads dan tetap dimuat pada kunjungan nyata; hanya waktu muncul pertama bergeser ke interaksi. `ads.txt` tidak berubah.
- Handler `pageshow` di `index.html` hanya mengoreksi scroll untuk pemulihan bfcache (`event.persisted`). Pemuatan pertama tidak lagi membaca `scrollX/scrollY` pada dokumen penuh.
- Logo header/footer memakai `israanwar-mark-ia-v2-mono-160.webp` (2,1 KiB) menggantikan berkas 800×800 (16,6 KiB) yang ditampilkan 39×39 px.

## Bukti lokal

Build lengkap lulus 343 HTML publik dan 343 sitemap URL. Lighthouse 13.5.0, `vite preview`, tiga run per konfigurasi:

| Konfigurasi | Performa | TBT | LCP | SI |
|---|---:|---:|---:|---:|
| Mobile, CPU 4× | 99, 99, 99 | 20 ms | 2,0 s | 1,2–1,8 s |
| Mobile, CPU 12× (mendekati hardware Google) | 98, 98, 98 | 110–120 ms | 2,0 s | 1,2–2,0 s |
| Desktop | 100, 100 | 0 ms | 0,5 s | 0,5 s |

Dasar sebelum perubahan (ads dimuat saat idle, CPU 12×) berkisar 88–98 dengan TBT 110–450 ms pada tiga run, sehingga selisih sebagian berada dalam noise mesin. Pengamatan Playwright: 0 permintaan iklan sebelum input, tepat 1 setelahnya, tanpa page error, logo 160 px termuat di mobile dan desktop.

## Batas

- Sisa selisih mobile ke 100 adalah LCP simulasi 2,0 s (pengamatan lokal LCP = FCP = 105 ms). Penyebab simulasi belum dibuktikan; memangkas preload font hanya menggeser sekitar 0,2 s dan tidak dirilis.
- `content-visibility: auto` pada section bawah fold diuji dan **dibatalkan**: tidak memperbaiki TBT dan memperburuk Speed Index.
- Pemuatan iklan setelah interaksi menyentuh waktu tampil iklan; pendapatan dan kebijakan AdSense perlu dipantau. Rendering iklan nyata belum diverifikasi (skrip iklan dimock pada pengujian).
- Perubahan ini belum memiliki hasil Google produksi. Jalankan PageSpeed pada deployment kandidat sebelum menyimpulkan.
