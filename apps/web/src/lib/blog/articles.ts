export type BlogSection = {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  sections: readonly BlogSection[];
};

export const blogArticles = [
  {
    slug:
      "cara-memulai-usaha-online-dari-nol",
    title:
      "Cara Memulai Usaha Online dari Nol",
    description:
      "Panduan sederhana untuk menentukan produk, menyiapkan harga dan stok, memilih kanal penjualan, lalu mulai mencari pembeli pertama.",
    category:
      "Mulai Usaha",
    readingMinutes:
      7,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Mulai dari masalah yang ingin Anda selesaikan",
        paragraphs: [
          "Usaha online tidak harus dimulai dengan katalog besar. Untuk tahap awal, pilih satu masalah pelanggan yang jelas lalu tentukan produk atau jasa yang dapat membantu menyelesaikannya.",
          "Semakin sederhana fokus awal Anda, semakin mudah menguji apakah orang benar-benar tertarik membeli.",
        ],
        bullets: [
          "Siapa calon pembeli utama Anda?",
          "Masalah apa yang mereka alami?",
          "Produk apa yang paling sederhana untuk mulai ditawarkan?",
        ],
      },
      {
        heading:
          "Siapkan fondasi operasional",
        paragraphs: [
          "Catat nama produk, biaya atau modal, harga jual, dan stok awal. Informasi sederhana ini sudah cukup untuk mulai mengelola usaha dengan lebih rapi.",
          "Jangan menunggu sistem sempurna. Tujuan pertama adalah memiliki satu sumber data yang konsisten sehingga Anda mengetahui apa yang dijual dan berapa stok yang tersedia.",
        ],
      },
      {
        heading:
          "Pilih satu atau dua kanal penjualan",
        paragraphs: [
          "Anda tidak harus hadir di semua marketplace dan media sosial sekaligus. Pilih kanal yang paling dekat dengan kebiasaan calon pelanggan Anda.",
        ],
        bullets: [
          "WhatsApp untuk jaringan pribadi dan pelanggan yang sudah mengenal Anda.",
          "Instagram atau TikTok untuk membangun perhatian melalui konten.",
          "Marketplace seperti Shopee untuk menjangkau orang yang sudah memiliki niat membeli.",
        ],
      },
      {
        heading:
          "Fokus mendapatkan pembeli pertama",
        paragraphs: [
          "Pada minggu pertama, tujuan yang lebih realistis bukan menjadi besar, melainkan belajar dari respons pasar. Buat konten sederhana, tawarkan produk ke orang yang relevan, dan catat pertanyaan yang paling sering muncul.",
          "LAKUVO Guided Start membantu Anda menyiapkan fondasi ini lalu mengarahkan langkah berikutnya melalui TODAY dan AI.",
        ],
      },
    ],
  },
  {
    slug:
      "cara-memilih-produk-untuk-dijual-online",
    title:
      "Cara Memilih Produk untuk Dijual Online",
    description:
      "Pelajari cara menilai ide produk berdasarkan kebutuhan pelanggan, kemampuan operasional, margin, dan potensi permintaan.",
    category:
      "Produk & Stok",
    readingMinutes:
      6,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Jangan hanya mengikuti produk yang sedang ramai",
        paragraphs: [
          "Produk yang ramai belum tentu cocok untuk usaha Anda. Pertimbangkan apakah Anda memahami calon pembelinya, dapat memperoleh stok dengan stabil, dan mampu menjelaskan alasan produk tersebut layak dibeli.",
        ],
      },
      {
        heading:
          "Nilai produk dari empat sisi",
        paragraphs: [
          "Sebuah ide produk menjadi lebih menarik ketika kebutuhan pelanggan, margin, kemampuan operasional, dan cara memasarkannya sama-sama masuk akal.",
        ],
        bullets: [
          "Ada masalah atau kebutuhan pelanggan yang jelas.",
          "Harga jual masih memberikan ruang terhadap biaya.",
          "Stok atau pasokan dapat dikelola.",
          "Produk cukup mudah diperlihatkan dan dijelaskan melalui konten.",
        ],
      },
      {
        heading:
          "Mulai dengan katalog kecil",
        paragraphs: [
          "Satu sampai beberapa produk yang dipahami dengan baik sering lebih mudah dikelola daripada puluhan produk yang belum teruji.",
          "Setelah mulai mendapat data penjualan, Anda dapat melihat produk mana yang patut dipertahankan, dikembangkan, atau dihentikan.",
        ],
      },
    ],
  },
  {
    slug:
      "cara-menentukan-harga-jual",
    title:
      "Cara Menentukan Harga Jual untuk Pemula",
    description:
      "Panduan menentukan harga jual dengan mempertimbangkan biaya, margin, pelanggan, dan posisi produk di pasar.",
    category:
      "Mulai Usaha",
    readingMinutes:
      6,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Harga bukan sekadar modal ditambah keuntungan",
        paragraphs: [
          "Harga jual perlu menutup biaya yang benar-benar terkait dengan produk sekaligus tetap masuk akal bagi calon pelanggan.",
          "Selain harga beli atau biaya produksi, perhatikan kemasan, biaya transaksi, potensi diskon, dan biaya operasional lain yang relevan.",
        ],
      },
      {
        heading:
          "Gunakan harga awal sebagai hipotesis",
        paragraphs: [
          "Untuk bisnis baru, Anda tidak harus menemukan harga sempurna pada hari pertama. Tentukan harga yang masuk akal, lalu pelajari respons pelanggan dan kondisi margin.",
        ],
        bullets: [
          "Berapa total biaya yang perlu ditutup?",
          "Berapa margin yang ingin dipertahankan?",
          "Apa nilai utama yang diterima pelanggan?",
          "Bagaimana kisaran harga produk sejenis?",
        ],
      },
      {
        heading:
          "Hindari perang harga",
        paragraphs: [
          "Menjadi yang termurah bukan satu-satunya cara menjual. Kejelasan manfaat, pelayanan, kemasan, kecepatan respons, dan kepercayaan dapat membantu produk memiliki posisi yang lebih kuat.",
        ],
      },
    ],
  },
  {
    slug:
      "cara-menghitung-margin-sederhana",
    title:
      "Cara Menghitung Margin Sederhana",
    description:
      "Pahami perbedaan omzet, laba kotor, dan margin agar keputusan harga tidak hanya berdasarkan jumlah penjualan.",
    category:
      "Penjualan",
    readingMinutes:
      5,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Omzet bukan keuntungan",
        paragraphs: [
          "Jika sebuah produk terjual Rp100.000, angka tersebut belum berarti Anda memperoleh keuntungan Rp100.000. Anda tetap perlu mengurangi biaya produk dan biaya lain yang relevan.",
        ],
      },
      {
        heading:
          "Contoh sederhana",
        paragraphs: [
          "Jika harga jual sebuah produk Rp100.000 dan biaya produknya Rp60.000, laba kotor sederhananya adalah Rp40.000.",
          "Margin kotor terhadap harga jual pada contoh tersebut adalah 40%. Perhitungan nyata dapat berubah jika ada biaya marketplace, pembayaran, promosi, pengiriman yang ditanggung penjual, atau biaya operasional lainnya.",
        ],
      },
      {
        heading:
          "Gunakan margin untuk mengambil keputusan",
        paragraphs: [
          "Produk dengan penjualan tinggi belum tentu paling sehat jika marginnya sangat tipis. Karena itu, lihat volume penjualan dan margin secara bersamaan.",
        ],
      },
    ],
  },
  {
    slug:
      "cara-membuat-sku-produk",
    title:
      "Cara Membuat SKU Produk yang Rapi",
    description:
      "Pelajari fungsi SKU dan cara membuat kode produk yang mudah dipahami ketika katalog mulai bertambah.",
    category:
      "Produk & Stok",
    readingMinutes:
      5,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Apa itu SKU?",
        paragraphs: [
          "SKU adalah kode internal yang membantu bisnis membedakan produk dan variasinya. SKU terutama berguna untuk operasional internal, bukan sebagai nama pemasaran produk.",
        ],
      },
      {
        heading:
          "Buat pola yang konsisten",
        paragraphs: [
          "Gunakan pola pendek yang masih mudah dibaca tim. Tidak perlu memasukkan terlalu banyak informasi ke dalam satu kode.",
        ],
        bullets: [
          "Kategori atau jenis produk.",
          "Model atau nama singkat.",
          "Warna atau ukuran jika memiliki varian.",
          "Nomor urut jika dibutuhkan.",
        ],
      },
      {
        heading:
          "Jangan mengubah SKU tanpa alasan",
        paragraphs: [
          "SKU yang konsisten membantu pencarian data, pencocokan stok, dan integrasi marketplace. Jika pola perlu diperbarui, lakukan dengan aturan yang jelas.",
        ],
      },
    ],
  },
  {
    slug:
      "cara-mengelola-stok-untuk-pemula",
    title:
      "Cara Mengelola Stok untuk Pemula",
    description:
      "Panduan dasar agar stok produk tetap tercatat, mengurangi risiko overselling, dan membantu menentukan kapan perlu restock.",
    category:
      "Produk & Stok",
    readingMinutes:
      6,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Mulai dari stok aktual",
        paragraphs: [
          "Catat jumlah barang yang benar-benar tersedia untuk dijual. Angka stok sebaiknya menggambarkan kondisi operasional, bukan perkiraan.",
        ],
      },
      {
        heading:
          "Setiap perubahan perlu tercatat",
        paragraphs: [
          "Stok berubah ketika ada penjualan, barang masuk, kerusakan, retur, atau koreksi. Semakin cepat perubahan dicatat, semakin kecil kemungkinan keputusan dibuat dari angka yang salah.",
        ],
      },
      {
        heading:
          "Kenali stok rendah",
        paragraphs: [
          "Tidak semua produk membutuhkan jumlah persediaan yang sama. Produk yang sering terjual mungkin perlu batas stok rendah yang berbeda dari produk dengan pergerakan lambat.",
          "LAKUVO dapat menggunakan data stok dan penjualan untuk membantu memprioritaskan risiko inventori melalui TODAY dan intelligence.",
        ],
      },
    ],
  },
  {
    slug:
      "cara-mendapatkan-pembeli-pertama",
    title:
      "Cara Mendapatkan Pembeli Pertama",
    description:
      "Strategi organik sederhana untuk bisnis baru yang belum memiliki audiens besar atau anggaran iklan.",
    category:
      "Marketing",
    readingMinutes:
      7,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Jangan menunggu banyak follower",
        paragraphs: [
          "Pembeli pertama sering datang dari jaringan terdekat, komunitas yang relevan, atau orang yang menemukan konten yang sangat sesuai dengan kebutuhannya.",
        ],
      },
      {
        heading:
          "Buat penawaran yang mudah dipahami",
        paragraphs: [
          "Dalam beberapa detik, calon pelanggan sebaiknya dapat memahami apa produknya, untuk siapa produk tersebut, dan manfaat utamanya.",
        ],
        bullets: [
          "Tunjukkan masalah yang diselesaikan.",
          "Perlihatkan produk secara nyata.",
          "Sebutkan manfaat utama tanpa klaim berlebihan.",
          "Berikan call to action yang jelas.",
        ],
      },
      {
        heading:
          "Mulai percakapan, bukan hanya promosi",
        paragraphs: [
          "Tanyakan masalah pelanggan, tanggapi pertanyaan, dan catat keberatan yang muncul. Informasi tersebut berguna untuk memperbaiki produk, harga, dan konten berikutnya.",
        ],
      },
      {
        heading:
          "Ulangi yang memberikan sinyal",
        paragraphs: [
          "Konten yang mendapat pertanyaan, kunjungan produk, atau percakapan berkualitas dapat menjadi petunjuk untuk aktivitas pemasaran berikutnya.",
        ],
      },
    ],
  },
  {
    slug:
      "ide-konten-7-hari-untuk-bisnis-baru",
    title:
      "Ide Konten 7 Hari untuk Bisnis Baru",
    description:
      "Contoh agenda konten satu minggu untuk memperkenalkan bisnis tanpa harus langsung menggunakan iklan berbayar.",
    category:
      "Marketing",
    readingMinutes:
      6,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Hari 1-2: perkenalkan masalah dan produk",
        paragraphs: [
          "Hari pertama dapat digunakan untuk membahas masalah pelanggan. Hari kedua tunjukkan bagaimana produk Anda berkaitan dengan masalah tersebut.",
        ],
      },
      {
        heading:
          "Hari 3-4: bangun kepercayaan",
        paragraphs: [
          "Tunjukkan proses, cara penggunaan, detail bahan, alasan memilih produk, atau cerita di balik bisnis. Konten seperti ini membantu calon pembeli memahami apa yang mereka dapatkan.",
        ],
      },
      {
        heading:
          "Hari 5-6: jawab pertanyaan dan keberatan",
        paragraphs: [
          "Gunakan pertanyaan pelanggan sebagai bahan konten. Jelaskan ukuran, penggunaan, pengiriman, perawatan, variasi, atau hal lain yang sering membuat orang ragu.",
        ],
      },
      {
        heading:
          "Hari 7: ajak mengambil tindakan",
        paragraphs: [
          "Ringkas manfaat utama lalu gunakan call to action sederhana, misalnya menghubungi WhatsApp, melihat produk, atau melakukan pemesanan.",
          "Growth Assistant LAKUVO dapat membantu menyusun variasi rencana seperti ini berdasarkan konteks bisnis dan produk pengguna.",
        ],
      },
    ],
  },
  {
    slug:
      "instagram-tiktok-atau-marketplace",
    title:
      "Mulai dari Instagram, TikTok, atau Marketplace?",
    description:
      "Cara memilih kanal awal berdasarkan jenis produk, kemampuan membuat konten, dan perilaku calon pelanggan.",
    category:
      "Marketplace",
    readingMinutes:
      6,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Instagram",
        paragraphs: [
          "Instagram cocok ketika visual, katalog, identitas brand, dan komunikasi melalui pesan memiliki peran besar dalam proses pembelian.",
        ],
      },
      {
        heading:
          "TikTok",
        paragraphs: [
          "TikTok menarik untuk produk yang mudah didemonstrasikan melalui video pendek, cerita, edukasi, transformasi, atau hiburan.",
        ],
      },
      {
        heading:
          "Marketplace",
        paragraphs: [
          "Marketplace seperti Shopee membantu bisnis bertemu pengguna yang sudah berada dalam konteks belanja. Konsekuensinya, persaingan harga, kualitas listing, rating, layanan, dan operasional menjadi semakin penting.",
        ],
      },
      {
        heading:
          "Tidak harus memilih selamanya",
        paragraphs: [
          "Pilih kanal awal yang paling realistis untuk dijalankan secara konsisten. Ketika operasional sudah rapi, Anda dapat menambah kanal dan menggunakan sistem sinkronisasi agar data tidak terpecah.",
        ],
      },
    ],
  },
  {
    slug:
      "cara-menggunakan-ai-untuk-usaha-kecil",
    title:
      "Cara Menggunakan AI untuk Membantu Usaha Kecil",
    description:
      "Contoh penggunaan AI untuk memahami bisnis, membuat ide konten, menganalisis data, dan menyiapkan pekerjaan tanpa kehilangan kontrol.",
    category:
      "AI untuk UMKM",
    readingMinutes:
      7,
    publishedAt:
      "2026-08-27",
    updatedAt:
      "2026-08-27",
    sections: [
      {
        heading:
          "Gunakan AI sebagai asisten berpikir",
        paragraphs: [
          "AI berguna untuk merangkum informasi, menghasilkan alternatif, menjelaskan data, dan membantu menyusun rencana. Nilai terbaik muncul ketika AI mendapatkan konteks bisnis yang relevan.",
        ],
      },
      {
        heading:
          "Contoh penggunaan untuk bisnis kecil",
        paragraphs: [
          "AI dapat membantu pekerjaan yang sebelumnya membutuhkan banyak waktu untuk dipikirkan dari awal.",
        ],
        bullets: [
          "Membuat ide konten dan caption.",
          "Menyusun rencana pemasaran tujuh hari.",
          "Menjelaskan perubahan penjualan atau stok.",
          "Membantu memprioritaskan pekerjaan.",
          "Menyiapkan draft tindakan sebelum pengguna menyetujuinya.",
        ],
      },
      {
        heading:
          "AI tidak seharusnya mengambil kontrol tanpa batas",
        paragraphs: [
          "Untuk tindakan yang mengubah harga, stok, marketplace, atau aktivitas penting lainnya, sistem yang dapat dipercaya perlu memiliki validasi dan kontrol pengguna.",
          "Prinsip LAKUVO adalah menggunakan AI untuk reasoning dan software deterministik untuk execution.",
        ],
      },
      {
        heading:
          "Dari Assistant menuju Agents",
        paragraphs: [
          "Assistant membantu pengguna memahami. Agents nantinya dapat membantu mengerjakan workflow multi-step, tetapi tindakan nyata tetap dapat melalui proposal, validasi, approval, execution, dan audit.",
        ],
      },
    ],
  },
] as const satisfies readonly BlogArticle[];

export function getBlogArticle(
  slug: string,
): BlogArticle | null {
  return (
    blogArticles.find(
      (article) =>
        article.slug === slug,
    ) ?? null
  );
}