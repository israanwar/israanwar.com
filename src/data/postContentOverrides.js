// Local content overrides applied on top of whatever Supabase currently
// serves for a given post slug. Exists because writes to the Supabase
// project are temporarily blocked (plan/usage limit), so edits here ship
// through the normal git -> Vercel deploy path instead of a database write.
// Remove an entry once the same edit has been applied directly in Supabase
// (title/slug/content etc.), so this file does not silently drift from the
// source of truth forever.
//
// Keyed by the CURRENT Supabase `slug` column (the old slug), since that's
// what the database query in supabaseData.js still runs against. Each
// override may itself set a new `slug`/`canonical_path`, which is what
// actually renames the post's public URL (see SLUG_RENAMES in
// slugRenames.js for the reverse lookup used to resolve incoming requests).
export const POST_CONTENT_OVERRIDES = {
  "e-commerce-yang-serius-tidak-dimulai-dari-keranjang-tapi-dari-rasa-percaya": {
    "title": "Sebelum Mikirin Keranjang, E-Commerce yang Serius Harus Menang di Rasa Percaya Dulu",
    "meta_title": "E-Commerce Harus Menang di Rasa Percaya Dulu",
    "meta_description": "E-commerce yang serius dibangun dari kepercayaan, bukan sekadar keranjang. Pelajaran dari sejarah eBay, riset checkout Baymard, dan psikologi social proof.",
    "excerpt": "Toko online yang bagus bukan cuma soal katalog dan tombol checkout. Ia mesin kepercayaan, persis seperti masalah yang dipecahkan eBay sejak 1996.",
    "focus_keyword": "strategi e-commerce berbasis kepercayaan pembeli",
    "reading_time": 7,
    "image_alt": "Sebelum Mikirin Keranjang, E-Commerce yang Serius Harus Menang di Rasa Percaya Dulu",
    "faqs": [
      {
        "question": "Kenapa cart abandonment tinggi walaupun produk saya bagus?",
        "answer": "Biasanya bukan produk yang salah, tapi checkout yang mengejutkan. Baymard Institute mencatat rata-rata cart abandonment ada di kisaran 70 persen, dan alasan paling sering muncul adalah biaya tambahan yang baru terlihat di langkah terakhir, bukan harga produknya sendiri."
      },
      {
        "question": "Apa perbaikan e-commerce yang paling dulu harus dikerjakan?",
        "answer": "Munculkan estimasi ongkir sejak halaman produk, sediakan guest checkout yang sungguhan, dan pastikan pengalaman mobile lancar. Tiga hal ini biasanya memberi lift paling besar tanpa perlu tools baru atau redesign total."
      },
      {
        "question": "Bagaimana cara tahu toko online saya sudah punya cukup kepercayaan dari pembeli?",
        "answer": "Perhatikan jenis pertanyaan yang masuk. Kalau orang bertanya soal warna, ukuran, atau stok, itu tanda kepercayaan dasar sudah terbentuk. Kalau masih ada yang bertanya apakah toko ini asli atau menipu, tandanya trust signal di halaman produk belum cukup kuat."
      }
    ],
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Tahun 1995, seorang programmer bernama Pierre Omidyar membuat situs lelang kecil-kecilan bernama AuctionWeb, cikal bakal eBay. Idenya sederhana. Orang bisa menjual barang bekas kepada orang asing di seluruh negeri, tanpa toko fisik, tanpa tatap muka. Tapi begitu transaksi pertama mulai berjalan, muncul satu masalah yang jauh lebih besar daripada logistik atau pembayaran. Bagaimana caranya orang asing berani mengirim uang kepada orang asing lain, untuk barang yang bahkan tidak pernah mereka pegang?"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Omidyar tidak menjawabnya dengan menambah fitur belanja. Ia menjawabnya dengan membangun Feedback Forum pada 1996, sistem rating dan ulasan sederhana yang memungkinkan pembeli menilai penjual, dan sebaliknya. Bukan katalog yang menyelamatkan eBay dari kegagalan. Bukan juga desain situsnya, yang waktu itu masih sangat sederhana. Yang menyelamatkan eBay cuma satu hal. Mereka menemukan cara membuat orang asing berani percaya satu sama lain, dalam skala yang sebelumnya tidak pernah ada dalam sejarah perdagangan."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Hampir tiga puluh tahun kemudian, masalah yang sama masih jadi akar dari sebagian besar e-commerce yang gagal, cuma kita menyebutnya dengan istilah lain. Bounce rate. Cart abandonment. Conversion rate rendah. Padahal kalau ditelusuri ke akarnya, masalahnya sering persis sama dengan yang dihadapi Omidyar tahun 1995. Pembeli belum cukup percaya untuk bergerak dari melihat ke membeli."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Jawaban Pendeknya"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "E-commerce yang sehat itu, kalau boleh disederhanakan, adalah mesin kepercayaan yang kebetulan menjual produk. Katalog, keranjang, checkout, payment gateway, notifikasi, semua itu penting, tapi statusnya cuma alat. Alat itu baru bekerja kalau pembeli merasa cukup yakin untuk bergerak dari melihat menjadi membeli. Conversion rate bukan lahir dari tombol yang warnanya lebih menyala. Conversion rate lahir dari perjalanan yang membuat keraguan turun pelan-pelan, satu pertanyaan pada satu waktu."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Baymard Institute, lembaga riset UX asal Denmark yang sejak 2011 secara khusus meneliti usability checkout dan mobile commerce lintas ratusan situs, punya kesimpulan yang konsisten dari tahun ke tahun. Rata-rata tingkat pengabaian keranjang belanja bertengger di kisaran 70 persen, dan alasan paling sering disebut bukan harga produk, melainkan biaya tambahan yang muncul mendadak di langkah akhir, misalnya ongkir, pajak, atau biaya admin yang tidak terlihat sejak awal. Sejalan dengan apa yang saya sebut di atas, yang bikin orang ragu bukan produknya, tapi kejutan yang tidak diharapkan."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Trafik Bukan Selalu Masalah Pertama"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Hampir setiap klien yang datang ke saya membuka percakapan dengan pertanyaan yang sama, “Gimana caranya biar traffic naik?” Pertanyaan itu sah, tapi jarang jadi pertanyaan pertama yang tepat. Kalau toko belum menjawab keraguan dasar pembeli, menaikkan traffic cuma memperbanyak orang yang datang, celingak-celinguk, lalu pergi. Ibaratnya membuka pintu lebar-lebar ke ruangan yang belum dirapikan. Ramai iya. Dipercaya belum tentu."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Sebelum bicara traffic, saya biasanya audit tiga hal dulu. Pertama, kejelasan halaman produk. Apakah foto, ukuran, dan spesifikasi gampang dipahami tanpa pembeli harus menebak-nebak? Kedua, transparansi biaya. Apakah harga, ongkir, stok, dan kebijakan retur sudah terlihat sebelum pembeli merasa perlu mencari-cari? Ketiga, bukti sosial yang relevan, bukan testimoni generik “barang bagus”, tapi bukti yang menjawab keraguan spesifik yang biasa muncul untuk kategori produk itu. Robert Cialdini, dalam bukunya Influence, sudah lama menjelaskan kenapa manusia cenderung meniru keputusan orang lain saat mereka sendiri tidak yakin. Itu sebabnya ulasan yang spesifik jauh lebih kuat daripada sekadar bintang lima tanpa konteks."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Di banyak kasus, pembeli batal bukan karena tidak mau membeli. Mereka batal karena ada satu pertanyaan kecil yang tidak terjawab. Satu saja. Dan pertanyaan kecil itu sering tidak kelihatan oleh pemilik toko, karena pemilik toko sudah terlalu hafal produknya sendiri. Bagi pemilik, semuanya sudah jelas. Bagi pembeli baru, semuanya masih abu-abu."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Halaman Produk Adalah Wiraniaga yang Tidak Pernah Tidur"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Halaman produk bukan etalase pasif. Ia wiraniaga yang bekerja 24 jam tanpa jeda. Bedanya, ia tidak bisa berimprovisasi kalau ada pertanyaan mendadak. Jadi semua jawaban penting harus sudah disiapkan sebelum pembeli sempat bertanya."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Foto harus membantu, bukan sekadar cantik. Deskripsi harus menjawab use case, untuk siapa, dipakai kapan, dipasangkan dengan apa, bukan cuma menyalin ulang spesifikasi dari pabrik. Kalau produk punya banyak varian, bantu pembeli memilih; jangan cuma menampilkan dropdown yang dingin tanpa penjelasan beda ukuran, bahan, atau edisi. Kalau produk butuh perawatan khusus, tuliskan. Pembeli tidak selalu malas membaca. Mereka malas membaca tulisan yang tidak menolong mereka mengambil keputusan."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Ini nyambung dengan alasan kenapa "
            },
            {
              "type": "text",
              "text": "website yang kelihatan bagus pun masih bisa bikin orang ragu",
              "marks": [
                {
                  "type": "link",
                  "attrs": {
                    "href": "/blog/tampilan-website-sudah-meyakinkan-tapi-orang-masih-ragu-untuk-percaya"
                  }
                }
              ]
            },
            {
              "type": "text",
              "text": ". Tampilan modern saja tidak cukup. Yang membuat orang tenang mengambil keputusan adalah kejelasan, bukan estetika semata. Dalam e-commerce, ketenangan semacam itu bisa langsung berarti uang."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Checkout Adalah Ujian Terakhir Sebelum Orang Berubah Pikiran"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Checkout yang baik itu membosankan, dalam artian yang bagus. Tidak banyak kejutan. Tidak ada langkah aneh di tengah jalan. Tidak tiba-tiba minta bikin akun padahal orang sudah siap bayar. Tidak menyembunyikan biaya tambahan sampai halaman terakhir."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Kalau checkout terasa seperti labirin, pembeli akan ingat bahwa mereka masih punya satu pilihan yang jauh lebih gampang daripada menyelesaikan masalah, yaitu menutup tab. Ini kedengarannya keras, tapi begitulah kenyataannya. Di internet, orang tidak perlu marah dulu untuk pergi. Mereka cukup menghilang, tanpa keluhan, tanpa jejak."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Beberapa prinsip yang menurut pengalaman saya hampir selalu berlaku."
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Tampilkan estimasi total biaya sedini mungkin, idealnya sejak halaman produk, bukan ditahan sampai langkah terakhir."
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Sediakan guest checkout yang sungguhan, kalau bisnis memang tidak betul-betul butuh akun di awal."
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Kurangi kolom formulir yang sebetulnya tidak perlu."
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Simpan progres pembeli kalau mereka harus kembali ke langkah sebelumnya."
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Tunjukkan trust signal yang relevan, seperti metode pembayaran yang dikenal, estimasi pengiriman yang realistis, dan kebijakan retur yang jelas."
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Trust signal, perlu saya tegaskan, bukan stiker keamanan palsu yang ditempel supaya toko terlihat serius. Trust signal harus menjawab kekhawatiran yang sesungguhnya. Kalau pembeli khawatir barang telat, jawab dengan estimasi yang jujur. Kalau khawatir salah ukuran, jawab dengan panduan ukuran. Kalau khawatir barang rusak di jalan, jawab dengan prosedur komplain yang jelas, bukan janji kosong."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Mobile Commerce Tidak Kenal Ampun"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Di desktop, pembeli masih punya sedikit ruang untuk memaafkan layout yang agak berantakan. Di mobile, tidak. Layar yang kecil membuat setiap kebingungan terasa jauh lebih mahal. Tombol yang kekecilan, filter yang susah dipakai, gambar yang lambat dimuat, teks deskripsi yang kepanjangan tanpa struktur, popup yang menutupi separuh layar, semua itu bisa membuat orang pergi dalam hitungan detik."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Riset Baymard tentang mobile commerce menunjukkan pola yang berulang di hampir semua studi mereka. Mayoritas kegagalan mobile commerce bukan soal fitur yang kurang, melainkan gesekan kecil yang menumpuk, misalnya form yang terlalu panjang untuk diisi lewat keyboard virtual, tombol yang meleset saat disentuh jempol, atau proses yang memaksa pembeli berpindah aplikasi di tengah jalan lalu lupa kembali."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Orang belanja lewat HP sambil antre, sambil menunggu ojek datang, sambil rebahan setengah mendengarkan orang rumah bicara. Prioritasnya jelas. Produk harus cepat dipahami, gambar harus ringan tapi tetap tajam, tombol aksi harus gampang dijangkau jempol, dan informasi penting tidak boleh membuat halaman terasa seperti brosur yang kepanjangan."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "SEO E-Commerce Itu Soal Cakupan, Bukan Sekadar Unggah Produk"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Banyak toko online mengira urusan SEO selesai begitu produk sudah diunggah dengan nama, harga, dan deskripsi singkat. Belum selesai. Search engine, dan sekarang juga answer engine seperti asisten AI yang mulai dipakai orang untuk mencari rekomendasi belanja, butuh konteks yang jauh lebih dalam daripada sekadar nama produk. Mereka perlu memahami produk itu sebagai satu entitas yang terhubung dengan kategori, kebutuhan, dan pertanyaan yang menyertainya."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Praktiknya, ini berarti membuat halaman kategori yang benar-benar menjawab niat pencarian, bukan cuma daftar produk yang difilter. Membuat panduan pemilihan. Membuat FAQ produk yang menjawab pertanyaan spesifik. Membuat artikel pendukung, lalu menghubungkannya ke kategori atau produk yang relevan lewat internal link yang memang nyambung secara konteks, bukan ditempel asal ada kata kunci. Ini juga alasan kenapa saya selalu bilang "
            },
            {
              "type": "text",
              "text": "SEO setelah AI menuntut konten yang benar-benar memberi info baru, bukan menjawab persis seperti hasil pencarian yang sudah ada",
              "marks": [
                {
                  "type": "link",
                  "attrs": {
                    "href": "/blog/seo-di-zaman-ai-sudah-berubah-konten-generik-duluan-ditinggalkan"
                  }
                }
              ]
            },
            {
              "type": "text",
              "text": ". Kalau artikel Anda cuma mengulang apa yang sudah bertebaran di halaman satu Google, mesin pencari, dan juga pembaca, tidak punya alasan menaruh perhatian ekstra padanya."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Kalau menjual produk premium, bantu pembeli memahami kenapa harganya masuk akal. Kalau menjual produk teknis, bantu mereka memilih spesifikasi yang tepat. Kalau menjual produk yang biasa dibeli untuk hadiah, bantu mereka menemukan momen yang pas. SEO e-commerce yang baik tidak memaksa search engine menebak-nebak. Ia memberi struktur, dan struktur itu yang pada akhirnya juga memudahkan pembeli."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Pertanyaan yang Sering Muncul"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Apakah e-commerce harus selalu punya promo? Tidak selalu. Promo bisa membantu mendorong keputusan di detik-detik akhir, tapi promo bukan fondasi. Kalau semua konversi bergantung pada diskon, brand sedang melatih pelanggannya sendiri untuk menunggu harga turun sebelum mau membeli. Kadang yang perlu dibenahi itu kepercayaan, bukan harga."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Apakah marketplace saja sudah cukup, tidak perlu website sendiri? Marketplace bagus untuk distribusi dan menjangkau demand yang sudah aktif mencari. Tapi website sendiri memberi kontrol atas narasi, data pelanggan, SEO jangka panjang, dan pengalaman brand yang tidak segampang itu ditiru kompetitor. Idealnya keduanya tidak saling membunuh. Marketplace berperan untuk permintaan yang sudah panas, website berperan untuk membangun otoritas dan hubungan jangka panjang."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Apakah desain harus terlihat mewah? Tidak harus. Yang penting jelas, cepat, konsisten, dan menolong pembeli mengambil keputusan. Desain mewah tanpa kejelasan cuma mahal secara visual, dan pembeli yang ragu tidak peduli seberapa bagus foto heronya."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Penutup"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Kembali ke Pierre Omidyar. Yang menarik dari cerita eBay bukan cuma karena mereka menemukan solusi tepat di tahun 1996. Yang menarik adalah masalah intinya, bagaimana membuat orang asing berani percaya, ternyata tidak pernah benar-benar selesai. Setiap generasi teknologi e-commerce cuma menemukan bentuk baru untuk masalah lama yang sama. Marketplace menemukan rating dan ulasan. Payment gateway menemukan escrow dan garansi uang kembali. Sekarang, giliran toko online kecil dan menengah yang harus menemukan versi mereka sendiri, bagaimana caranya, dalam skala yang jauh lebih kecil, membuat orang asing berani mengklik “beli sekarang.”"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "E-commerce yang bagus itu tidak cerewet, tapi peka. Ia tahu kapan harus menjelaskan, kapan harus diam, kapan harus memberi bukti, dan kapan harus memberi jalan paling pendek menuju keputusan. Kalau pembeli sudah merasa aman, mereka tidak perlu didorong terlalu keras untuk membeli."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Jadi sebelum buru-buru menambah budget iklan, coba audit dulu rasa percaya di toko Anda sendiri, dari homepage ke kategori, dari halaman produk ke keranjang, dari checkout sampai email konfirmasi. Kalau perjalanan itu sudah rapi, traffic yang datang akan punya tempat mendarat. Kalau belum, traffic cuma jadi angka yang lewat begitu saja, persis seperti pengunjung AuctionWeb di tahun 1995, yang datang, melihat-lihat, lalu pergi karena belum ada alasan untuk percaya."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Poin Praktis"
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Audit halaman produk dari sudut pandang pertanyaan pembeli, bukan dari sudut pandang pemilik toko yang sudah hafal produknya sendiri."
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Tampilkan biaya, ongkir, dan kebijakan retur sebelum pembeli merasa dijebak di langkah terakhir."
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Bangun kategori dan panduan beli sebagai aset SEO jangka panjang, bukan sekadar daftar produk yang difilter."
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Prioritaskan mobile UX, karena mayoritas keraguan pembeli sekarang terjadi di layar yang paling kecil."
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Hubungkan artikel edukasi ke kategori dan produk yang relevan lewat internal link yang benar-benar nyambung konteksnya."
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Baca Juga"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Kalau kepercayaan dasarnya sudah rapi dan Anda ingin mendorong angka lebih jauh, lanjut ke kenapa "
            },
            {
              "type": "text",
              "text": "CRO itu bukan sekadar ganti warna tombol",
              "marks": [
                {
                  "type": "link",
                  "attrs": {
                    "href": "/blog/cro-itu-lebih-dari-sekadar-ganti-warna-tombol"
                  }
                }
              ]
            },
            {
              "type": "text",
              "text": " dan kenapa "
            },
            {
              "type": "text",
              "text": "website yang kelihatan meyakinkan pun masih bisa bikin orang ragu",
              "marks": [
                {
                  "type": "link",
                  "attrs": {
                    "href": "/blog/tampilan-website-sudah-meyakinkan-tapi-orang-masih-ragu-untuk-percaya"
                  }
                }
              ]
            },
            {
              "type": "text",
              "text": "."
            }
          ]
        }
      ]
    },
    "slug": "sebelum-mikirin-keranjang-e-commerce-yang-serius-harus-menang-di-rasa-percaya-dulu",
    "canonical_path": "/blog/sebelum-mikirin-keranjang-e-commerce-yang-serius-harus-menang-di-rasa-percaya-dulu"
  },
  "bisnis-kecil-setelah-dunia-pindah-ke-layar": {
    "title": "Dunia Sudah Pindah ke Layar, Bisnis Kecil Belum Tentu Ikut Pindah",
    "meta_title": "Bisnis Kecil Belum Tentu Ikut Pindah ke Layar",
    "image_alt": "Dunia Sudah Pindah ke Layar, Bisnis Kecil Belum Tentu Ikut Pindah",
    "slug": "dunia-sudah-pindah-ke-layar-bisnis-kecil-belum-tentu-ikut-pindah",
    "canonical_path": "/blog/dunia-sudah-pindah-ke-layar-bisnis-kecil-belum-tentu-ikut-pindah"
  },
  "ketika-semua-orang-online-masalahnya-bukan-lagi-punya-akun": {
    "title": "Online Saja Tidak Cukup, yang Dicari Orang Itu Alasan untuk Memilih",
    "meta_title": "Online Saja Tidak Cukup untuk Dipilih Orang",
    "image_alt": "Online Saja Tidak Cukup, yang Dicari Orang Itu Alasan untuk Memilih",
    "slug": "online-saja-tidak-cukup-yang-dicari-orang-itu-alasan-untuk-memilih",
    "canonical_path": "/blog/online-saja-tidak-cukup-yang-dicari-orang-itu-alasan-untuk-memilih"
  },
  "branding-di-era-scroll-cepat-dipercaya-sebelum-dijelaskan": {
    "title": "Orang Scroll dalam Hitungan Detik, Brand yang Membosankan Kalah Duluan",
    "meta_title": "Brand yang Membosankan Kalah Duluan",
    "image_alt": "Orang Scroll dalam Hitungan Detik, Brand yang Membosankan Kalah Duluan",
    "slug": "orang-scroll-dalam-hitungan-detik-brand-yang-membosankan-kalah-duluan",
    "canonical_path": "/blog/orang-scroll-dalam-hitungan-detik-brand-yang-membosankan-kalah-duluan"
  },
  "selling-yang-baik-adalah-arsitektur-kepercayaan": {
    "title": "Selling yang Bagus Itu Tidak Terasa Seperti Dikejar-kejar",
    "meta_title": "Selling yang Bagus Tidak Terasa Seperti Dikejar",
    "image_alt": "Selling yang Bagus Itu Tidak Terasa Seperti Dikejar-kejar",
    "slug": "selling-yang-bagus-itu-tidak-terasa-seperti-dikejar-kejar",
    "canonical_path": "/blog/selling-yang-bagus-itu-tidak-terasa-seperti-dikejar-kejar"
  },
  "kenapa-banyak-website-gagal-menjual-walau-tampil-bagus": {
    "title": "Website-nya Sudah Cantik, Tapi Kok Tetap Tidak Ada yang Beli",
    "meta_title": "Website Cantik, Tapi Kok Tidak Ada yang Beli",
    "image_alt": "Website-nya Sudah Cantik, Tapi Kok Tetap Tidak Ada yang Beli",
    "slug": "website-nya-sudah-cantik-tapi-kok-tetap-tidak-ada-yang-beli",
    "canonical_path": "/blog/website-nya-sudah-cantik-tapi-kok-tetap-tidak-ada-yang-beli"
  },
  "workflow-adalah-infrastruktur-kreatif": {
    "title": "Kalau Kerjaan Berantakan, Coba Cek Dulu Workflow-nya Ada di Mana",
    "meta_title": "Cek Dulu, Workflow-nya Ada di Mana",
    "image_alt": "Kalau Kerjaan Berantakan, Coba Cek Dulu Workflow-nya Ada di Mana",
    "slug": "kalau-kerjaan-berantakan-coba-cek-dulu-workflow-nya-ada-di-mana",
    "canonical_path": "/blog/kalau-kerjaan-berantakan-coba-cek-dulu-workflow-nya-ada-di-mana"
  },
  "ai-tidak-menggantikan-strategi-ia-menguji-kedewasaan-bisnis": {
    "title": "AI Tidak Bikin Strategi Mati, Cuma Bikin yang Berantakan Ketahuan",
    "meta_title": "AI Bikin yang Berantakan Ketahuan",
    "image_alt": "AI Tidak Bikin Strategi Mati, Cuma Bikin yang Berantakan Ketahuan",
    "slug": "ai-tidak-bikin-strategi-mati-cuma-bikin-yang-berantakan-ketahuan",
    "canonical_path": "/blog/ai-tidak-bikin-strategi-mati-cuma-bikin-yang-berantakan-ketahuan"
  },
  "politik-perhatian-di-era-algoritma": {
    "title": "Merasa Banyak Tahu Itu Gampang, Kalau Semua Disodorkan Algoritma",
    "meta_title": "Merasa Tahu Karena Disodorkan Algoritma",
    "image_alt": "Merasa Banyak Tahu Itu Gampang, Kalau Semua Disodorkan Algoritma",
    "slug": "merasa-banyak-tahu-itu-gampang-kalau-semua-disodorkan-algoritma",
    "canonical_path": "/blog/merasa-banyak-tahu-itu-gampang-kalau-semua-disodorkan-algoritma"
  },
  "seo-in-the-age-of-ai-search-is-still-about-trust": {
    "title": "SEO di Zaman AI Sudah Berubah, Konten Generik Duluan Ditinggalkan",
    "meta_title": "SEO di Zaman AI, Konten Generik Kalah",
    "image_alt": "SEO di Zaman AI Sudah Berubah, Konten Generik Duluan Ditinggalkan",
    "slug": "seo-di-zaman-ai-sudah-berubah-konten-generik-duluan-ditinggalkan",
    "canonical_path": "/blog/seo-di-zaman-ai-sudah-berubah-konten-generik-duluan-ditinggalkan"
  },
  "digital-education-needs-better-thinking-not-more-tools": {
    "title": "Kalau Belajar Digital Cuma Hafal Tombol, Wajar Cepat Ketinggalan",
    "meta_title": "Belajar Digital Bukan Cuma Hafal Tombol",
    "image_alt": "Kalau Belajar Digital Cuma Hafal Tombol, Wajar Cepat Ketinggalan",
    "slug": "kalau-belajar-digital-cuma-hafal-tombol-wajar-cepat-ketinggalan",
    "canonical_path": "/blog/kalau-belajar-digital-cuma-hafal-tombol-wajar-cepat-ketinggalan"
  },
  "website-yang-bagus-juga-bisa-sepi-pengunjung": {
    "title": "Tampilan Bagus Tidak Otomatis Bikin Website Ramai Pengunjung",
    "meta_title": "Tampilan Bagus, Website Masih Bisa Sepi",
    "image_alt": "Tampilan Bagus Tidak Otomatis Bikin Website Ramai Pengunjung",
    "slug": "tampilan-bagus-tidak-otomatis-bikin-website-ramai-pengunjung",
    "canonical_path": "/blog/tampilan-bagus-tidak-otomatis-bikin-website-ramai-pengunjung"
  },
  "ai-workflow-untuk-bisnis-kecil-mulai-dari-audit-bukan-tool": {
    "title": "Sebelum Buru-buru Pakai AI, Cek Dulu Kerjaan yang Paling Bikin Capek",
    "meta_title": "Sebelum Pakai AI, Audit Kerjaan Dulu",
    "image_alt": "Sebelum Buru-buru Pakai AI, Cek Dulu Kerjaan yang Paling Bikin Capek",
    "slug": "sebelum-buru-buru-pakai-ai-cek-dulu-kerjaan-yang-paling-bikin-capek",
    "canonical_path": "/blog/sebelum-buru-buru-pakai-ai-cek-dulu-kerjaan-yang-paling-bikin-capek"
  },
  "ekonomi-digital-tidak-cukup-dengan-produk-ia-butuh-distribusi": {
    "title": "Produknya Sudah Bagus, Masalahnya Mungkin di Jalan Menuju Pembeli",
    "meta_title": "Produk Bagus, Tapi Jalannya Belum Ada",
    "image_alt": "Produknya Sudah Bagus, Masalahnya Mungkin di Jalan Menuju Pembeli",
    "slug": "produknya-sudah-bagus-masalahnya-mungkin-di-jalan-menuju-pembeli",
    "canonical_path": "/blog/produknya-sudah-bagus-masalahnya-mungkin-di-jalan-menuju-pembeli"
  },
  "brand-yang-cerdas-tidak-mengejar-semua-orang": {
    "title": "Brand yang Berusaha Disukai Semua Orang Sering Lupa Punya Target",
    "meta_title": "Brand yang Disukai Semua Orang Lupa Target",
    "image_alt": "Brand yang Berusaha Disukai Semua Orang Sering Lupa Punya Target",
    "slug": "brand-yang-berusaha-disukai-semua-orang-sering-lupa-punya-target",
    "canonical_path": "/blog/brand-yang-berusaha-disukai-semua-orang-sering-lupa-punya-target"
  },
  "masa-depan-digital-milik-tim-kecil-yang-punya-sistem-belajar": {
    "title": "Tim Kecil Bisa Menang Asal Kerjanya Tidak Serba Panik",
    "meta_title": "Tim Kecil Bisa Menang Tanpa Kerja Panik",
    "image_alt": "Tim Kecil Bisa Menang Asal Kerjanya Tidak Serba Panik",
    "slug": "tim-kecil-bisa-menang-asal-kerjanya-tidak-serba-panik",
    "canonical_path": "/blog/tim-kecil-bisa-menang-asal-kerjanya-tidak-serba-panik"
  },
  "catatan-israanwar-kenapa-blog-ini-dibangun-sebagai-mesin-pengetahuan": {
    "title": "Kenapa Kami Membangun Blog Ini Bukan Sekadar Tempat Numpang Nulis",
    "meta_title": "Kenapa Blog Ini Bukan Sekadar Tempat Nulis",
    "image_alt": "Kenapa Kami Membangun Blog Ini Bukan Sekadar Tempat Numpang Nulis",
    "slug": "kenapa-kami-membangun-blog-ini-bukan-sekadar-tempat-numpang-nulis",
    "canonical_path": "/blog/kenapa-kami-membangun-blog-ini-bukan-sekadar-tempat-numpang-nulis"
  },
  "cara-membaca-riset-tanpa-jadi-korban-grafik-cantik": {
    "title": "Biar Tidak Gampang Percaya, Begini Cara Membaca Riset yang Benar",
    "meta_title": "Cara Membaca Riset Tanpa Tertipu Grafik",
    "image_alt": "Biar Tidak Gampang Percaya, Begini Cara Membaca Riset yang Benar",
    "slug": "biar-tidak-gampang-percaya-begini-cara-membaca-riset-yang-benar",
    "canonical_path": "/blog/biar-tidak-gampang-percaya-begini-cara-membaca-riset-yang-benar"
  },
  "inovasi-teknologi-yang-waras-dimulai-dari-masalah-yang-benar": {
    "title": "Inovasi Teknologi yang Berguna Dimulai dari Masalah Nyata, Bukan Ikut Tren",
    "meta_title": "Inovasi Teknologi Dimulai dari Masalah Nyata",
    "image_alt": "Inovasi Teknologi yang Berguna Dimulai dari Masalah Nyata, Bukan Ikut Tren",
    "slug": "inovasi-teknologi-yang-berguna-dimulai-dari-masalah-nyata-bukan-ikut-tren",
    "canonical_path": "/blog/inovasi-teknologi-yang-berguna-dimulai-dari-masalah-nyata-bukan-ikut-tren"
  },
  "case-study-merapikan-website-yang-ramai-tapi-tidak-menjual": {
    "title": "Case Study Website Ramai Pengunjung, Tapi Susah Closing",
    "meta_title": "Case Study Website Ramai Tapi Susah Closing",
    "image_alt": "Case Study Website Ramai Pengunjung, Tapi Susah Closing",
    "slug": "case-study-website-ramai-pengunjung-tapi-susah-closing",
    "canonical_path": "/blog/case-study-website-ramai-pengunjung-tapi-susah-closing"
  },
  "cro-itu-bukan-mengubah-warna-tombol-bro": {
    "title": "CRO Itu Lebih dari Sekadar Ganti Warna Tombol",
    "meta_title": "CRO Lebih dari Sekadar Ganti Warna Tombol",
    "image_alt": "CRO Itu Lebih dari Sekadar Ganti Warna Tombol",
    "slug": "cro-itu-lebih-dari-sekadar-ganti-warna-tombol",
    "canonical_path": "/blog/cro-itu-lebih-dari-sekadar-ganti-warna-tombol"
  },
  "website-yang-tajam-adalah-mesin-kepercayaan": {
    "title": "Tampilan Website Sudah Meyakinkan, Tapi Orang Masih Ragu untuk Percaya",
    "meta_title": "Website Meyakinkan, Tapi Orang Masih Ragu",
    "image_alt": "Tampilan Website Sudah Meyakinkan, Tapi Orang Masih Ragu untuk Percaya",
    "slug": "tampilan-website-sudah-meyakinkan-tapi-orang-masih-ragu-untuk-percaya",
    "canonical_path": "/blog/tampilan-website-sudah-meyakinkan-tapi-orang-masih-ragu-untuk-percaya"
  }
};
