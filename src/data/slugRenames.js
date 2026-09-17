// Old slug -> new slug map for the humanized-title pass. Keep this as the
// single source of truth: used at read-time (supabaseData.js) to resolve a
// new URL back to its Supabase row, at route-time (BlogSlugRouter.jsx) to
// redirect any lingering old-slug link inside the SPA, and at build-time
// (scripts/generate-sitemap.mjs) so the sitemap emits the new URLs.
export const SLUG_RENAMES = {
  "bisnis-kecil-setelah-dunia-pindah-ke-layar": "dunia-sudah-pindah-ke-layar-bisnis-kecil-belum-tentu-ikut-pindah",
  "ketika-semua-orang-online-masalahnya-bukan-lagi-punya-akun": "online-saja-tidak-cukup-yang-dicari-orang-itu-alasan-untuk-memilih",
  "branding-di-era-scroll-cepat-dipercaya-sebelum-dijelaskan": "orang-scroll-dalam-hitungan-detik-brand-yang-membosankan-kalah-duluan",
  "selling-yang-baik-adalah-arsitektur-kepercayaan": "selling-yang-bagus-itu-tidak-terasa-seperti-dikejar-kejar",
  "kenapa-banyak-website-gagal-menjual-walau-tampil-bagus": "website-nya-sudah-cantik-tapi-kok-tetap-tidak-ada-yang-beli",
  "workflow-adalah-infrastruktur-kreatif": "kalau-kerjaan-berantakan-coba-cek-dulu-workflow-nya-ada-di-mana",
  "ai-tidak-menggantikan-strategi-ia-menguji-kedewasaan-bisnis": "ai-tidak-bikin-strategi-mati-cuma-bikin-yang-berantakan-ketahuan",
  "politik-perhatian-di-era-algoritma": "merasa-banyak-tahu-itu-gampang-kalau-semua-disodorkan-algoritma",
  "seo-in-the-age-of-ai-search-is-still-about-trust": "seo-di-zaman-ai-sudah-berubah-konten-generik-duluan-ditinggalkan",
  "digital-education-needs-better-thinking-not-more-tools": "kalau-belajar-digital-cuma-hafal-tombol-wajar-cepat-ketinggalan",
  "website-yang-bagus-juga-bisa-sepi-pengunjung": "tampilan-bagus-tidak-otomatis-bikin-website-ramai-pengunjung",
  "ai-workflow-untuk-bisnis-kecil-mulai-dari-audit-bukan-tool": "sebelum-buru-buru-pakai-ai-cek-dulu-kerjaan-yang-paling-bikin-capek",
  "ekonomi-digital-tidak-cukup-dengan-produk-ia-butuh-distribusi": "produknya-sudah-bagus-masalahnya-mungkin-di-jalan-menuju-pembeli",
  "brand-yang-cerdas-tidak-mengejar-semua-orang": "brand-yang-berusaha-disukai-semua-orang-sering-lupa-punya-target",
  "masa-depan-digital-milik-tim-kecil-yang-punya-sistem-belajar": "tim-kecil-bisa-menang-asal-kerjanya-tidak-serba-panik",
  "catatan-israanwar-kenapa-blog-ini-dibangun-sebagai-mesin-pengetahuan": "kenapa-kami-membangun-blog-ini-bukan-sekadar-tempat-numpang-nulis",
  "cara-membaca-riset-tanpa-jadi-korban-grafik-cantik": "biar-tidak-gampang-percaya-begini-cara-membaca-riset-yang-benar",
  "inovasi-teknologi-yang-waras-dimulai-dari-masalah-yang-benar": "inovasi-teknologi-yang-berguna-dimulai-dari-masalah-nyata-bukan-ikut-tren",
  "case-study-merapikan-website-yang-ramai-tapi-tidak-menjual": "case-study-website-ramai-pengunjung-tapi-susah-closing",
  "cro-itu-bukan-mengubah-warna-tombol-bro": "cro-itu-lebih-dari-sekadar-ganti-warna-tombol",
  "website-yang-tajam-adalah-mesin-kepercayaan": "tampilan-website-sudah-meyakinkan-tapi-orang-masih-ragu-untuk-percaya",
  "e-commerce-yang-serius-tidak-dimulai-dari-keranjang-tapi-dari-rasa-percaya": "sebelum-mikirin-keranjang-e-commerce-yang-serius-harus-menang-di-rasa-percaya-dulu"
};
