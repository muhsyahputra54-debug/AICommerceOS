import type { Locale } from "./config";

const dictionaries = {
  id: {
    common: {
      language: "Bahasa",
      indonesian: "Indonesia",
      english: "Inggris",
    },

    languageSwitcher: {
      ariaLabel: "Pilih bahasa",
    },

    brand: {
      tagline: "Inteligensi Bisnis",
    },

    header: {
      openNavigation: "Buka navigasi",
      searchPlaceholder: "Cari...",
      notifications: "Notifikasi",
    },

    navigation: {
      sections: {
        main: "Utama",
        system: "Sistem",
        navigation: "Navigasi",
      },

      items: {
        dashboard: "Dasbor",
        aiAssistant: "Asisten AI",
        products: "Produk",
        marketplaces: "Marketplace",
        productResearch: "Riset Produk",
        orders: "Pesanan",
        customers: "Pelanggan",
        suppliers: "Pemasok",
        analytics: "Analitik",
        settings: "Pengaturan",
      },

      closeNavigation: "Tutup navigasi",
      closeSidebar: "Tutup sidebar",
    },

    login: {
      subtitle: "Masuk ke dasbor LAKUVO",
      continueWithGitHub: "Lanjutkan dengan GitHub",
    },

    dashboard: {
      title: "Dasbor",
      subtitle: "Ringkasan kinerja commerce organisasi aktif.",
      noOrganization: "Organisasi aktif tidak ditemukan.",

      stats: {
        revenue: {
          title: "Pendapatan",
          description: "Penjualan selesai",
        },
        completedOrders: {
          title: "Pesanan Selesai",
          description: "Pesanan berstatus selesai",
        },
        customers: {
          title: "Pelanggan",
          description: "Pelanggan organisasi aktif",
        },
        grossProfit: {
          title: "Laba Kotor",
          description: "Pendapatan dikurangi biaya",
        },
      },

      revenueChart: {
        title: "Pendapatan & Laba",
        description: "Penjualan selesai dalam 7 hari terakhir",
        emptyTitle: "Belum ada penjualan selesai",
        emptyDescription:
          "Tren akan muncul setelah pesanan mencapai status selesai.",
        revenueLabel: "Pendapatan",
        profitLabel: "Laba",
      },

      performance: {
        title: "Ringkasan Kinerja",
        description: "Metrik aktual dari pesanan yang selesai.",
        grossMargin: "Margin Kotor",
        averageOrder: "Rata-rata Pesanan",
        unitsSold: "Unit Terjual",
        productsSold: "Produk Terjual",
      },

      quickActions: {
        title: "Aksi Cepat",
        description: "Akses cepat ke fitur utama.",

        items: {
          addProduct: {
            title: "Tambah Produk",
            description: "Tambahkan produk baru",
          },
          viewOrders: {
            title: "Lihat Pesanan",
            description: "Kelola pesanan",
          },
          customers: {
            title: "Pelanggan",
            description: "Lihat pelanggan",
          },
          settings: {
            title: "Pengaturan",
            description: "Kelola pengaturan sistem",
          },
        },
      },

      recentOrders: {
        title: "Pesanan Terbaru",
        description: "Transaksi terbaru",
        viewAll: "Lihat semua",

        columns: {
          customer: "Pelanggan",
          product: "Produk",
          amount: "Jumlah",
          status: "Status",
          date: "Tanggal",
        },

        statuses: {
          paid: "Dibayar",
          pending: "Tertunda",
          processing: "Diproses",
        },

        dates: {
          today: "Hari ini",
          yesterday: "Kemarin",
          twoDaysAgo: "2 hari lalu",
        },
      },
    },

    settings: {
      title: "Pengaturan",
      description:
        "Kelola pengaturan dan konfigurasi LAKUVO.",

      general: {
        title: "Pengaturan Umum",
        description:
          "Pengaturan umum aplikasi dan informasi bisnis.",
        businessName: "Nama Bisnis",
        accountRole: "Peran Akun",
        administrator: "Administrator",
      },

      ai: {
        title: "Pengaturan AI",
        description:
          "Konfigurasi Asisten AI dan automasi.",
        assistant: "Asisten AI",
        automation: "Automasi",
        readyToConfigure: "Siap dikonfigurasi",
      },

      account: {
        title: "Pengaturan Akun",
        description:
          "Informasi akun administrator.",
        role: "Peran",
        status: "Status",
        administrator: "Administrator",
        active: "Aktif",
      },

      system: {
        title: "Pengaturan Sistem",
        description:
          "Konfigurasi sistem dan infrastruktur aplikasi.",
        environment: "Lingkungan",
        development: "Pengembangan",
        systemStatus: "Status Sistem",
        operational: "Operasional",
      },
    },

    products: {
      title: "Produk",
      description: "Kelola produk dan katalog bisnis Anda.",
      noOrganization: "Organisasi aktif tidak ditemukan.",

      management: {
        title: "Manajemen Produk",
        matchingProducts:
          "produk sesuai filter pada organisasi aktif.",
        inventoryHistory: "Riwayat Inventaris",
        addProduct: "Tambah Produk",
      },

      filters: {
        searchPlaceholder: "Cari nama atau SKU...",
        allStatuses: "Semua status",
        active: "Aktif",
        inactive: "Tidak Aktif",
        allCategories: "Semua kategori",
        newest: "Terbaru",
        oldest: "Terlama",
        nameAsc: "Nama A-Z",
        nameDesc: "Nama Z-A",
        priceAsc: "Harga rendah-tinggi",
        priceDesc: "Harga tinggi-rendah",
        stockAsc: "Stok rendah-tinggi",
        stockDesc: "Stok tinggi-rendah",
        apply: "Terapkan",
        reset: "Reset",
      },

      empty: {
        title: "Produk tidak ditemukan",
        description:
          "Coba ubah pencarian atau filter yang digunakan.",
      },

      table: {
        product: "Produk",
        sku: "SKU",
        category: "Kategori",
        sellingPrice: "Harga Jual",
        costPrice: "Harga Modal",
        stock: "Stok",
        status: "Status",
        actions: "Aksi",
        unknown: "Tidak diketahui",
        uncategorized: "Tanpa kategori",
      },

      actions: {
        edit: "Edit",
        variants: "Varian",
        suppliers: "Pemasok",
        performance: "Performa",
        aiDescription: "Deskripsi AI",
        images: "Gambar",
        adjustStock: "Sesuaikan Stok",
      },

      pagination: {
        page: "Halaman",
        of: "dari",
        products: "produk",
        previous: "Sebelumnya",
        next: "Berikutnya",
      },

      delete: {
        confirmPrefix: "Hapus produk ",
        confirmSuffix:
          "? Tindakan ini tidak dapat dibatalkan.",
        inUse:
          "Produk tidak dapat dihapus karena sudah digunakan pada pesanan.",
        notFound:
          "Produk tidak ditemukan atau tidak dapat dihapus.",
        deleting: "Menghapus...",
        delete: "Hapus",
      },

      workflow: {
        add: {
          title: "Tambah Produk",
          description:
            "Tambahkan produk baru ke katalog organisasi aktif.",
          saveProduct: "Simpan produk",
        },

        edit: {
          title: "Edit Produk",
          description:
            "Perbarui informasi produk pada organisasi aktif.",
          saveChanges: "Simpan perubahan",
        },

        fields: {
          productName: "Nama produk",
          productNamePlaceholder:
            "Contoh: Kaos Premium",
          sku: "SKU",
          skuPlaceholder:
            "Contoh: TSHIRT-BLK-M",
          skuHelp:
            "Opsional. Harus unik dalam organisasi.",
          category: "Kategori",
          noCategory: "Tanpa kategori",
          description: "Deskripsi",
          descriptionPlaceholder:
            "Deskripsi singkat produk",
          sellingPrice: "Harga Jual",
          costPrice: "Harga Modal",
          stock: "Stok",
          status: "Status",
          active: "Aktif",
          inactive: "Tidak Aktif",
        },

        validation: {
          nameRequired:
            "Nama produk wajib diisi.",
          priceInvalid:
            "Harga harus bernilai 0 atau lebih.",
          costPriceInvalid:
            "Harga modal harus bernilai 0 atau lebih.",
          stockInvalid:
            "Stok harus berupa bilangan bulat 0 atau lebih.",
          statusInvalid:
            "Status produk tidak valid.",
          skuInUse:
            "SKU sudah digunakan pada organisasi ini.",
          notFound:
            "Produk tidak ditemukan atau tidak dapat diubah.",
        },

        actions: {
          cancel: "Batal",
          saving: "Menyimpan...",
        },
      },

      variants: {
        title: "Varian Produk",
        backToProducts: "Kembali ke Produk",
        descriptionPrefix:
          "Kelola varian untuk",
        addVariant: "Tambah Varian",

        management: {
          title: "Manajemen Varian",
          countSuffix: "varian ditemukan.",
          emptyTitle: "Belum ada varian produk",
          emptyDescription:
            "Varian yang ditambahkan nanti akan tampil di sini.",
        },

        table: {
          variant: "Varian",
          sku: "SKU",
          sellingPrice: "Harga Jual",
          costPrice: "Harga Modal",
          stock: "Stok",
          status: "Status",
          actions: "Aksi",
        },

        statuses: {
          active: "Aktif",
          inactive: "Tidak Aktif",
        },

        actions: {
          edit: "Edit",
          adjustStock: "Sesuaikan Stok",
        },

        add: {
          title: "Tambah Varian Produk",
          descriptionPrefix:
            "Tambahkan varian untuk",
          saveVariant: "Simpan varian",
        },

        edit: {
          title: "Edit Varian Produk",
          descriptionPrefix:
            "Perbarui varian untuk",
          saveChanges: "Simpan perubahan",
        },

        form: {
          variantName: "Nama varian",
          variantNamePlaceholder:
            "Contoh: Hitam / Medium",
          sku: "SKU",
          skuPlaceholder:
            "Contoh: TSHIRT-BLK-M",
          skuHelp:
            "SKU harus unik dalam organisasi, termasuk terhadap SKU produk.",
          sellingPrice: "Harga Jual",
          costPrice: "Harga Modal",
          stock: "Stok",
          status: "Status",
          active: "Aktif",
          inactive: "Tidak Aktif",
          cancel: "Batal",
          saving: "Menyimpan...",
        },

        validation: {
          nameRequired:
            "Nama varian wajib diisi.",
          skuRequired:
            "SKU varian wajib diisi.",
          priceInvalid:
            "Harga jual harus bernilai 0 atau lebih.",
          costPriceInvalid:
            "Harga modal harus bernilai 0 atau lebih.",
          stockInvalid:
            "Stok harus berupa bilangan bulat 0 atau lebih.",
          statusInvalid:
            "Status varian tidak valid.",
          skuInUse:
            "SKU sudah digunakan pada organisasi ini.",
          notFound:
            "Varian tidak ditemukan atau tidak dapat diubah.",
        },

        delete: {
          confirmPrefix: "Hapus varian ",
          confirmSuffix:
            "? Tindakan ini tidak dapat dibatalkan.",
          notFound:
            "Varian tidak ditemukan atau tidak dapat dihapus.",
          deleting: "Menghapus...",
          delete: "Hapus",
        },
      },

      images: {
        title: "Gambar Produk",
        description:
          "Kelola gambar produk privat, gambar utama, dan urutan tampilan.",
        backToProducts: "Kembali ke Produk",

        upload: {
          title: "Unggah Gambar Produk",
          descriptionPrefix:
            "Unggah gambar untuk",
          descriptionSuffix:
            "Maksimal 5 MB.",
          imageFile: "File gambar",
          altText: "Teks alternatif",
          altPlaceholder:
            "Deskripsi singkat gambar",
          uploading: "Mengunggah...",
          uploadImage: "Unggah gambar",
        },

        validation: {
          chooseImage:
            "Pilih file gambar terlebih dahulu.",
          invalidFormat:
            "Format gambar harus JPEG, PNG, WebP, atau GIF.",
          maxSize:
            "Ukuran gambar maksimal 5 MB.",
          unsupportedFormat:
            "Format gambar tidak didukung.",
        },

        messages: {
          uploaded:
            "Gambar produk berhasil diunggah.",
          primaryUpdated:
            "Gambar utama berhasil diperbarui.",
          imageNotFound:
            "Gambar tidak ditemukan.",
          orderUpdated:
            "Urutan gambar berhasil diperbarui.",
          deleted:
            "Gambar produk berhasil dihapus.",
          metadataDeleteFailedPrefix:
            "File storage terhapus, tetapi metadata gagal dihapus:",
        },

        gallery: {
          title: "Gambar Produk",
          description:
            "Kelola gambar utama dan urutan tampilan produk.",
          emptyTitle:
            "Belum ada gambar produk",
          emptyDescription:
            "Unggah gambar pertama untuk membuat gambar utama.",
          previewUnavailable:
            "Pratinjau tidak tersedia",
          primary: "Utama",
          position: "Posisi",
        },

        actions: {
          setPrimary: "Jadikan utama",
          up: "Naik",
          down: "Turun",
          delete: "Hapus",
        },

        delete: {
          confirmPrefix: "Hapus gambar ",
          confirmSuffix: "?",
        },
      },
      aiDescription: {
        title: "Generator Deskripsi AI",
        description:
          "Buat draft deskripsi produk dan metadata SEO dengan bantuan AI.",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        backToProducts: "Kembali ke Produk",

        current: {
          title: "Deskripsi Produk Saat Ini",
          empty: "Belum ada deskripsi produk.",
        },

        generator: {
          title: "Buat Deskripsi",
          description:
            "AI hanya membuat draft. Deskripsi produk tidak berubah sampai Anda memilih Terapkan Deskripsi.",

          form: {
            tone: "Gaya",
            tones: {
              professional: "Profesional",
              friendly: "Ramah",
            },
            languagePlaceholder: "Bahasa",
            defaultLanguage: "Indonesian",
            targetAudiencePlaceholder:
              "Target audiens",
            instructionsPlaceholder:
              "Instruksi opsional...",
          },

          generating: "Membuat...",
          generate: "Buat Deskripsi AI",
        },

        latest: {
          title: "Konten Terbaru dari AI",
          applying: "Menerapkan...",
          apply: "Terapkan Deskripsi",
          productDescription: "Deskripsi Produk",
          shortDescription: "Deskripsi Singkat",
          seoTitle: "Judul SEO",
          metaDescription: "Meta Deskripsi",
          keywords: "Kata Kunci",
          applyNote:
            "Terapkan Deskripsi hanya memperbarui products.description.",
          empty:
            "Belum ada deskripsi AI yang selesai.",
        },

        history: {
          title: "Riwayat Generasi",
          empty: "Belum ada riwayat generasi.",
          date: "Tanggal",
          created: "Dibuat",
          provider: "Provider",
          model: "Model",
          tone: "Gaya",
          language: "Bahasa",
          status: "Status",
          error: "Error",
        },

        messages: {
          generated:
            "Generasi deskripsi AI selesai.",
          generationFailed:
            "Pembuatan deskripsi AI gagal. Silakan coba lagi.",
          applied:
            "Deskripsi hasil AI berhasil diterapkan ke produk.",
          applyFailed:
            "Gagal menerapkan deskripsi. Silakan coba lagi.",
          authenticationRequired:
            "Autentikasi diperlukan.",
          noOrganization:
            "Organisasi aktif tidak ditemukan.",
          toneTooLong:
            "Gaya terlalu panjang.",
          languageTooLong:
            "Bahasa terlalu panjang.",
          targetAudienceTooLong:
            "Target audiens terlalu panjang.",
          instructionsTooLong:
            "Instruksi terlalu panjang.",
          productNotFound:
            "Produk tidak ditemukan.",
          generationUnavailable:
            "Pembuatan deskripsi tidak dapat dibuat.",
        },
      },
      inventoryAdjustment: {
        page: {
          noOrganizationTitle: "Sesuaikan Stok Produk",
          noOrganization:
            "Organisasi aktif tidak ditemukan.",
          title: "Inventori Produk",
          description:
            "Kelola stok dan peringatan stok rendah untuk produk.",
        },

        adjustForm: {
          target: "Target inventori",
          currentStock: "Stok saat ini",
          adjustment: "Penyesuaian stok",
          adjustmentPlaceholder:
            "Contoh: 10 atau -3",
          adjustmentHelp:
            "Gunakan angka positif untuk menambah stok dan angka negatif untuk mengurangi stok.",
          note: "Catatan",
          notePlaceholder:
            "Contoh: Stock opname gudang",
          cancel: "Batal",
          adjusting: "Menyesuaikan...",
          submit: "Sesuaikan stok",
          invalidAdjustment:
            "Perubahan stok harus berupa bilangan bulat selain 0.",
          updateFailed:
            "Gagal memperbarui stok. Silakan coba lagi.",
        },

        thresholdForm: {
          title: "Peringatan Stok Rendah",
          description:
            "Inventori akan ditandai stok rendah ketika stok lebih besar dari 0 dan kurang dari atau sama dengan ambang ini.",
          label: "Ambang stok rendah",
          saving: "Menyimpan...",
          submit: "Simpan ambang",
          invalidThreshold:
            "Ambang stok rendah harus berupa bilangan bulat 0 atau lebih.",
          success:
            "Ambang stok rendah berhasil diperbarui.",
          updateFailed:
            "Gagal memperbarui ambang stok rendah. Silakan coba lagi.",
        },
      },
      performance: {
        title: "Performa Produk",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Penjualan, pendapatan, biaya historis, laba, margin, dan stok saat ini.",
        analytics: "Analitik",
        backToProducts: "Kembali ke Produk",
        noSalesTitle:
          "Belum ada penjualan selesai",
        noSalesDescription:
          "Produk ini belum memiliki penjualan yang selesai. Metrik performa tetap ditampilkan sebagai nilai nol.",
        metrics: {
          unitsSold: "Unit Terjual",
          revenue: "Pendapatan",
          historicalCost: "Biaya Historis",
          grossProfit: "Laba Kotor",
          grossMargin: "Margin Kotor",
          currentStock: "Stok Saat Ini",
        },
        note:
          "Pendapatan dan biaya menggunakan snapshot pesanan yang sudah selesai. Perubahan harga jual atau biaya produk setelah pesanan dibuat tidak mengubah performa historis.",
      },

      supplierSourcing: {
        noOrganizationTitle:
          "Supplier Produk",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        backToProducts:
          "Kembali ke Produk",
        title:
          "Sourcing Supplier Produk",
        descriptionPrefix:
          "Kelola supplier untuk",

        manager: {
          addTitle:
            "Tambah Sumber Supplier",
          addDescription:
            "Hubungkan supplier ke produk utama atau varian produk.",
          noActiveTitle:
            "Belum ada supplier aktif",
          noActiveDescription:
            "Tambahkan supplier terlebih dahulu sebelum membuat relasi sourcing.",
          addSupplier:
            "Tambah Supplier",

          selectSupplier:
            "Pilih supplier",
          baseProduct:
            "Produk Utama",
          variant:
            "Varian",
          unitCost:
            "Biaya Unit",
          minimumOrderQuantity:
            "Jumlah Pesanan Minimum",
          leadTimeDays:
            "Lead Time (hari)",
          leadTime:
            "Lead Time",
          notes:
            "Catatan",
          optional:
            "Opsional",
          notesPlaceholder:
            "Catatan sourcing opsional",
          preferredForTarget:
            "Supplier utama untuk target ini",

          saving:
            "Menyimpan...",
          addSource:
            "Tambah sumber supplier",

          relationsTitle:
            "Relasi Sourcing",
          relationsCount:
            "{count} relasi supplier ditemukan.",
          noRelationsTitle:
            "Belum ada relasi supplier",
          noRelationsDescription:
            "Tambahkan sumber supplier untuk produk atau varian.",

          preferred:
            "Utama",
          actions:
            "Aksi",
          edit:
            "Edit",
          delete:
            "Hapus",
          editTitle:
            "Edit Ketentuan Sourcing",
          saveChanges:
            "Simpan perubahan",
          cancel:
            "Batal",

          unknownVariant:
            "Varian tidak dikenal",
          unknownTarget:
            "Target tidak dikenal",
          unknownSupplier:
            "Tidak dikenal",
          genericSupplier:
            "supplier",

          days:
            "{count} hari",

          supplierRequired:
            "Supplier wajib dipilih.",
          targetInvalid:
            "Target sourcing tidak valid.",
          moqInvalid:
            "MOQ minimal 1.",

          duplicateAdd:
            "Relasi supplier sudah ada atau target sudah memiliki supplier utama.",
          duplicateEdit:
            "Target sudah memiliki supplier utama lain.",

          addFailed:
            "Gagal menambahkan sumber supplier. Silakan coba lagi.",
          editFailed:
            "Gagal memperbarui sumber supplier. Silakan coba lagi.",
          deleteFailed:
            "Gagal menghapus sumber supplier. Silakan coba lagi.",

          relationNotEditable:
            "Relasi supplier tidak ditemukan atau tidak dapat diubah.",
          relationNotDeletable:
            "Relasi supplier tidak ditemukan atau tidak dapat dihapus.",

          deleteConfirm:
            "Hapus relasi {supplier} dari {target}?",
        },
      },

      variantInventory: {
        noOrganizationTitle:
          "Sesuaikan Stok Varian",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        title:
          "Inventori Varian",
        description:
          "Kelola stok dan peringatan stok rendah untuk varian.",
      },
    },
    marketplaces: {
      title: "Integrasi Marketplace",
      description:
        "Kelola kanal marketplace dan pemetaan commerce organisasi aktif.",
      noOrganization:
        "Organisasi aktif tidak ditemukan.",

      accountManager: {
        validation: {
          required:
            "Provider dan nama marketplace wajib diisi.",
          alreadyRegistered:
            "Toko marketplace tersebut sudah terdaftar.",
          alreadyUsed:
            "Toko marketplace tersebut sudah digunakan.",
          notFound:
            "Akun marketplace tidak ditemukan.",
        },

        connect: {
          title: "Hubungkan Marketplace",
          description:
            "Tambahkan identitas toko atau kanal marketplace. Kredensial API tidak disimpan di sini.",
          provider: "Provider",
          providerPlaceholder:
            "Shopee, Tokopedia, TikTok Shop...",
          accountName: "Nama akun",
          accountNamePlaceholder:
            "Contoh: Toko Utama",
          externalShopId: "ID Toko Eksternal",
          optional: "Opsional",
          saving: "Menyimpan...",
          addMarketplace: "Tambah marketplace",
        },

        accounts: {
          title: "Akun Marketplace",
          countSuffix:
            "akun marketplace ditemukan.",
          emptyTitle: "Belum ada marketplace",
          emptyDescription:
            "Tambahkan kanal marketplace untuk memulai pemetaan.",
        },

        table: {
          marketplace: "Marketplace",
          provider: "Provider",
          shopId: "ID Toko",
          status: "Status",
          actions: "Aksi",
        },

        statuses: {
          active: "Aktif",
          inactive: "Tidak Aktif",
          error: "Error",
        },

        actions: {
          open: "Buka",
          edit: "Edit",
          delete: "Hapus",
        },

        edit: {
          title: "Edit Marketplace",
          saving: "Menyimpan...",
          saveChanges: "Simpan perubahan",
          cancel: "Batal",
        },

        delete: {
          confirmPrefix: "Hapus marketplace ",
          confirmSuffix:
            "? Listing, tautan pesanan, dan log sinkronisasi akun ini juga akan dihapus.",
        },
      },
    },
    analytics: {
      title: "Analitik",
      description:
        "Kinerja produk berdasarkan pesanan selesai pada organisasi aktif.",
      noOrganization:
        "Organisasi aktif tidak ditemukan.",

      emptySales: {
        title: "Belum ada penjualan selesai",
        description:
          "Pendapatan, biaya, laba, margin, dan tren penjualan akan dihitung dari pesanan nyata setelah mencapai status selesai.",
      },

      metrics: {
        revenue: {
          label: "Pendapatan",
          description:
            "Hanya penjualan selesai",
        },
        cost: {
          label: "Biaya",
          description:
            "Snapshot biaya historis",
        },
        grossProfit: {
          label: "Laba Kotor",
          description:
            "Pendapatan dikurangi biaya historis",
        },
        grossMargin: {
          label: "Margin Kotor",
          description:
            "Laba kotor / pendapatan",
        },
        completedOrders: "Pesanan Selesai",
        unitsSold: "Unit Terjual",
        productsSold: "Produk Terjual",
        averageOrderValue:
          "Rata-rata Nilai Pesanan",
      },

      chart: {
        title: "Tren Penjualan",
        description:
          "Pendapatan dan laba kotor dalam 30 hari terakhir",
        emptyTitle:
          "Belum ada penjualan selesai",
        emptyDescription:
          "Tren akan muncul setelah pesanan mencapai status selesai.",
        revenueLabel: "Pendapatan",
        profitLabel: "Laba",
      },

      productPerformance: {
        title: "Kinerja Produk",
        description:
          "Metrik penjualan menggunakan pesanan selesai dan biaya historis.",
        empty:
          "Belum ada produk pada organisasi aktif.",

        columns: {
          product: "Produk",
          sku: "SKU",
          units: "Unit",
          revenue: "Pendapatan",
          cost: "Biaya",
          profit: "Laba",
          margin: "Margin",
          stock: "Stok",
        },
      },
    },
  },
  en: {
    common: {
      language: "Language",
      indonesian: "Indonesian",
      english: "English",
    },

    languageSwitcher: {
      ariaLabel: "Select language",
    },

    brand: {
      tagline: "Business Intelligence",
    },

    header: {
      openNavigation: "Open navigation",
      searchPlaceholder: "Search...",
      notifications: "Notifications",
    },

    navigation: {
      sections: {
        main: "Main",
        system: "System",
        navigation: "Navigation",
      },

      items: {
        dashboard: "Dashboard",
        aiAssistant: "AI Assistant",
        products: "Products",
        marketplaces: "Marketplaces",
        productResearch: "Product Research",
        orders: "Orders",
        customers: "Customers",
        suppliers: "Suppliers",
        analytics: "Analytics",
        settings: "Settings",
      },

      closeNavigation: "Close navigation",
      closeSidebar: "Close sidebar",
    },

    login: {
      subtitle: "Sign in to your LAKUVO dashboard",
      continueWithGitHub: "Continue with GitHub",
    },

    dashboard: {
      title: "Dashboard",
      subtitle: "Commerce performance summary for the active organization.",
      noOrganization: "No active organization found.",

      stats: {
        revenue: {
          title: "Revenue",
          description: "Completed sales",
        },
        completedOrders: {
          title: "Completed Orders",
          description: "Orders with completed status",
        },
        customers: {
          title: "Customers",
          description: "Customers in the active organization",
        },
        grossProfit: {
          title: "Gross Profit",
          description: "Revenue minus cost",
        },
      },

      revenueChart: {
        title: "Revenue & Profit",
        description: "Completed sales over the last 7 days",
        emptyTitle: "No completed sales yet",
        emptyDescription:
          "The trend will appear after an order reaches completed status.",
        revenueLabel: "Revenue",
        profitLabel: "Profit",
      },

      performance: {
        title: "Performance Overview",
        description: "Actual metrics from completed orders.",
        grossMargin: "Gross Margin",
        averageOrder: "Average Order",
        unitsSold: "Units Sold",
        productsSold: "Products Sold",
      },

      quickActions: {
        title: "Quick Actions",
        description: "Quick access to primary features.",

        items: {
          addProduct: {
            title: "Add Product",
            description: "Add a new product",
          },
          viewOrders: {
            title: "View Orders",
            description: "Manage orders",
          },
          customers: {
            title: "Customers",
            description: "View customers",
          },
          settings: {
            title: "Settings",
            description: "Manage system settings",
          },
        },
      },

      recentOrders: {
        title: "Recent Orders",
        description: "Latest transactions",
        viewAll: "View all",

        columns: {
          customer: "Customer",
          product: "Product",
          amount: "Amount",
          status: "Status",
          date: "Date",
        },

        statuses: {
          paid: "Paid",
          pending: "Pending",
          processing: "Processing",
        },

        dates: {
          today: "Today",
          yesterday: "Yesterday",
          twoDaysAgo: "2 days ago",
        },
      },
    },

    settings: {
      title: "Settings",
      description:
        "Manage LAKUVO settings and configuration.",

      general: {
        title: "General Settings",
        description:
          "General application settings and business information.",
        businessName: "Business Name",
        accountRole: "Account Role",
        administrator: "Administrator",
      },

      ai: {
        title: "AI Settings",
        description:
          "Configure the AI Assistant and automation.",
        assistant: "AI Assistant",
        automation: "Automation",
        readyToConfigure: "Ready to configure",
      },

      account: {
        title: "Account Settings",
        description:
          "Administrator account information.",
        role: "Role",
        status: "Status",
        administrator: "Administrator",
        active: "Active",
      },

      system: {
        title: "System Settings",
        description:
          "Application system and infrastructure configuration.",
        environment: "Environment",
        development: "Development",
        systemStatus: "System Status",
        operational: "Operational",
      },
    },

    products: {
      title: "Products",
      description: "Manage your business products and catalog.",
      noOrganization: "No active organization found.",

      management: {
        title: "Product Management",
        matchingProducts:
          "products match the active organization filters.",
        inventoryHistory: "Inventory History",
        addProduct: "Add Product",
      },

      filters: {
        searchPlaceholder: "Search name or SKU...",
        allStatuses: "All statuses",
        active: "Active",
        inactive: "Inactive",
        allCategories: "All categories",
        newest: "Newest",
        oldest: "Oldest",
        nameAsc: "Name A-Z",
        nameDesc: "Name Z-A",
        priceAsc: "Price low-high",
        priceDesc: "Price high-low",
        stockAsc: "Stock low-high",
        stockDesc: "Stock high-low",
        apply: "Apply",
        reset: "Reset",
      },

      empty: {
        title: "No products found",
        description:
          "Try changing your search or filters.",
      },

      table: {
        product: "Product",
        sku: "SKU",
        category: "Category",
        sellingPrice: "Selling Price",
        costPrice: "Cost Price",
        stock: "Stock",
        status: "Status",
        actions: "Actions",
        unknown: "Unknown",
        uncategorized: "Uncategorized",
      },

      actions: {
        edit: "Edit",
        variants: "Variants",
        suppliers: "Suppliers",
        performance: "Performance",
        aiDescription: "AI Description",
        images: "Images",
        adjustStock: "Adjust Stock",
      },

      pagination: {
        page: "Page",
        of: "of",
        products: "products",
        previous: "Previous",
        next: "Next",
      },

      delete: {
        confirmPrefix: "Delete product ",
        confirmSuffix:
          "? This action cannot be undone.",
        inUse:
          "The product cannot be deleted because it is already used in an order.",
        notFound:
          "The product was not found or cannot be deleted.",
        deleting: "Deleting...",
        delete: "Delete",
      },

      workflow: {
        add: {
          title: "Add Product",
          description:
            "Add a new product to the active organization's catalog.",
          saveProduct: "Save product",
        },

        edit: {
          title: "Edit Product",
          description:
            "Update product information for the active organization.",
          saveChanges: "Save changes",
        },

        fields: {
          productName: "Product name",
          productNamePlaceholder:
            "Example: Premium T-Shirt",
          sku: "SKU",
          skuPlaceholder:
            "Example: TSHIRT-BLK-M",
          skuHelp:
            "Optional. Must be unique within the organization.",
          category: "Category",
          noCategory: "No category",
          description: "Description",
          descriptionPlaceholder:
            "Short product description",
          sellingPrice: "Selling Price",
          costPrice: "Cost Price",
          stock: "Stock",
          status: "Status",
          active: "Active",
          inactive: "Inactive",
        },

        validation: {
          nameRequired:
            "Product name is required.",
          priceInvalid:
            "Price must be 0 or greater.",
          costPriceInvalid:
            "Cost price must be 0 or greater.",
          stockInvalid:
            "Stock must be an integer of 0 or greater.",
          statusInvalid:
            "Product status is invalid.",
          skuInUse:
            "SKU is already used in this organization.",
          notFound:
            "The product was not found or cannot be updated.",
        },

        actions: {
          cancel: "Cancel",
          saving: "Saving...",
        },
      },

      variants: {
        title: "Product Variants",
        backToProducts: "Back to Products",
        descriptionPrefix:
          "Manage variants for",
        addVariant: "Add Variant",

        management: {
          title: "Variant Management",
          countSuffix: "variants found.",
          emptyTitle: "No product variants yet",
          emptyDescription:
            "Variants you add will appear here.",
        },

        table: {
          variant: "Variant",
          sku: "SKU",
          sellingPrice: "Selling Price",
          costPrice: "Cost Price",
          stock: "Stock",
          status: "Status",
          actions: "Actions",
        },

        statuses: {
          active: "Active",
          inactive: "Inactive",
        },

        actions: {
          edit: "Edit",
          adjustStock: "Adjust Stock",
        },

        add: {
          title: "Add Product Variant",
          descriptionPrefix:
            "Add a variant for",
          saveVariant: "Save variant",
        },

        edit: {
          title: "Edit Product Variant",
          descriptionPrefix:
            "Update the variant for",
          saveChanges: "Save changes",
        },

        form: {
          variantName: "Variant name",
          variantNamePlaceholder:
            "Example: Black / Medium",
          sku: "SKU",
          skuPlaceholder:
            "Example: TSHIRT-BLK-M",
          skuHelp:
            "SKU must be unique within the organization, including product SKUs.",
          sellingPrice: "Selling Price",
          costPrice: "Cost Price",
          stock: "Stock",
          status: "Status",
          active: "Active",
          inactive: "Inactive",
          cancel: "Cancel",
          saving: "Saving...",
        },

        validation: {
          nameRequired:
            "Variant name is required.",
          skuRequired:
            "Variant SKU is required.",
          priceInvalid:
            "Selling price must be 0 or greater.",
          costPriceInvalid:
            "Cost price must be 0 or greater.",
          stockInvalid:
            "Stock must be an integer of 0 or greater.",
          statusInvalid:
            "Variant status is invalid.",
          skuInUse:
            "SKU is already used in this organization.",
          notFound:
            "The variant was not found or cannot be updated.",
        },

        delete: {
          confirmPrefix: "Delete variant ",
          confirmSuffix:
            "? This action cannot be undone.",
          notFound:
            "The variant was not found or cannot be deleted.",
          deleting: "Deleting...",
          delete: "Delete",
        },
      },

      images: {
        title: "Product Images",
        description:
          "Manage private product images, the primary image, and display order.",
        backToProducts: "Back to Products",

        upload: {
          title: "Upload Product Image",
          descriptionPrefix:
            "Upload an image for",
          descriptionSuffix:
            "Maximum 5 MB.",
          imageFile: "Image file",
          altText: "Alt text",
          altPlaceholder:
            "Short image description",
          uploading: "Uploading...",
          uploadImage: "Upload image",
        },

        validation: {
          chooseImage:
            "Choose an image file first.",
          invalidFormat:
            "Image format must be JPEG, PNG, WebP, or GIF.",
          maxSize:
            "Maximum image size is 5 MB.",
          unsupportedFormat:
            "Image format is not supported.",
        },

        messages: {
          uploaded:
            "Product image uploaded successfully.",
          primaryUpdated:
            "Primary image updated successfully.",
          imageNotFound:
            "Image was not found.",
          orderUpdated:
            "Image order updated successfully.",
          deleted:
            "Product image deleted successfully.",
          metadataDeleteFailedPrefix:
            "The storage file was deleted, but metadata deletion failed:",
        },

        gallery: {
          title: "Product Images",
          description:
            "Manage the primary image and product display order.",
          emptyTitle:
            "No product images yet",
          emptyDescription:
            "Upload the first image to create a primary image.",
          previewUnavailable:
            "Preview unavailable",
          primary: "Primary",
          position: "Position",
        },

        actions: {
          setPrimary: "Set primary",
          up: "Up",
          down: "Down",
          delete: "Delete",
        },

        delete: {
          confirmPrefix: "Delete image ",
          confirmSuffix: "?",
        },
      },
      aiDescription: {
        title: "AI Description Generator",
        description:
          "Create product-description drafts and SEO metadata with AI assistance.",
        noOrganization:
          "No active organization was found.",
        backToProducts: "Back to Products",

        current: {
          title: "Current Product Description",
          empty: "No product description yet.",
        },

        generator: {
          title: "Generate Description",
          description:
            "AI only creates a draft. The product description will not change until you select Apply Description.",

          form: {
            tone: "Tone",
            tones: {
              professional: "Professional",
              friendly: "Friendly",
            },
            languagePlaceholder: "Language",
            defaultLanguage: "Indonesian",
            targetAudiencePlaceholder:
              "Target audience",
            instructionsPlaceholder:
              "Optional instructions...",
          },

          generating: "Generating...",
          generate: "Generate AI Description",
        },

        latest: {
          title: "Latest Generated Content",
          applying: "Applying...",
          apply: "Apply Description",
          productDescription: "Product Description",
          shortDescription: "Short Description",
          seoTitle: "SEO Title",
          metaDescription: "Meta Description",
          keywords: "Keywords",
          applyNote:
            "Apply Description only updates products.description.",
          empty:
            "No completed AI description yet.",
        },

        history: {
          title: "Generation History",
          empty: "No generation history.",
          date: "Date",
          created: "Created",
          provider: "Provider",
          model: "Model",
          tone: "Tone",
          language: "Language",
          status: "Status",
          error: "Error",
        },

        messages: {
          generated:
            "AI description generation completed.",
          generationFailed:
            "AI description generation failed. Please try again.",
          applied:
            "The generated description was applied to the product.",
          applyFailed:
            "Failed to apply the description. Please try again.",
          authenticationRequired:
            "Authentication is required.",
          noOrganization:
            "No active organization was found.",
          toneTooLong:
            "Tone is too long.",
          languageTooLong:
            "Language is too long.",
          targetAudienceTooLong:
            "Target audience is too long.",
          instructionsTooLong:
            "Instructions are too long.",
          productNotFound:
            "Product was not found.",
          generationUnavailable:
            "The description generation could not be created.",
        },
      },
      inventoryAdjustment: {
        page: {
          noOrganizationTitle: "Adjust Product Stock",
          noOrganization:
            "No active organization was found.",
          title: "Product Inventory",
          description:
            "Manage stock and low-stock alerts for this product.",
        },

        adjustForm: {
          target: "Inventory target",
          currentStock: "Current stock",
          adjustment: "Stock adjustment",
          adjustmentPlaceholder:
            "Example: 10 or -3",
          adjustmentHelp:
            "Use a positive number to increase stock and a negative number to reduce stock.",
          note: "Note",
          notePlaceholder:
            "Example: Warehouse stock count",
          cancel: "Cancel",
          adjusting: "Adjusting...",
          submit: "Adjust stock",
          invalidAdjustment:
            "The stock adjustment must be a non-zero integer.",
          updateFailed:
            "Failed to update stock. Please try again.",
        },

        thresholdForm: {
          title: "Low Stock Alert",
          description:
            "Inventory is marked as low stock when stock is greater than 0 and less than or equal to this threshold.",
          label: "Low stock threshold",
          saving: "Saving...",
          submit: "Save threshold",
          invalidThreshold:
            "The low stock threshold must be an integer of 0 or greater.",
          success:
            "Low stock threshold updated successfully.",
          updateFailed:
            "Failed to update the low stock threshold. Please try again.",
        },
      },
      performance: {
        title: "Product Performance",
        noOrganization:
          "No active organization was found.",
        description:
          "Sales, revenue, historical cost, profit, margin, and current stock.",
        analytics: "Analytics",
        backToProducts: "Back to Products",
        noSalesTitle:
          "No completed sales yet",
        noSalesDescription:
          "This product has no completed sales yet. Performance metrics are still displayed as actual zero values.",
        metrics: {
          unitsSold: "Units Sold",
          revenue: "Revenue",
          historicalCost: "Historical Cost",
          grossProfit: "Gross Profit",
          grossMargin: "Gross Margin",
          currentStock: "Current Stock",
        },
        note:
          "Revenue and cost use snapshots from completed orders. Changes to the product selling price or cost after an order is created do not change historical performance.",
      },

      supplierSourcing: {
        noOrganizationTitle:
          "Product Suppliers",
        noOrganization:
          "No active organization was found.",
        backToProducts:
          "Back to Products",
        title:
          "Product Supplier Sourcing",
        descriptionPrefix:
          "Manage suppliers for",

        manager: {
          addTitle:
            "Add Supplier Source",
          addDescription:
            "Connect a supplier to the base product or a product variant.",
          noActiveTitle:
            "No active suppliers yet",
          noActiveDescription:
            "Add a supplier before creating a sourcing relation.",
          addSupplier:
            "Add Supplier",

          selectSupplier:
            "Select supplier",
          baseProduct:
            "Base Product",
          variant:
            "Variant",
          unitCost:
            "Unit Cost",
          minimumOrderQuantity:
            "Minimum Order Quantity",
          leadTimeDays:
            "Lead Time (days)",
          leadTime:
            "Lead Time",
          notes:
            "Notes",
          optional:
            "Optional",
          notesPlaceholder:
            "Optional sourcing notes",
          preferredForTarget:
            "Preferred supplier for this target",

          saving:
            "Saving...",
          addSource:
            "Add supplier source",

          relationsTitle:
            "Sourcing Relations",
          relationsCount:
            "{count} supplier relations found.",
          noRelationsTitle:
            "No supplier relations yet",
          noRelationsDescription:
            "Add a supplier source for the product or a variant.",

          preferred:
            "Preferred",
          actions:
            "Actions",
          edit:
            "Edit",
          delete:
            "Delete",
          editTitle:
            "Edit Sourcing Terms",
          saveChanges:
            "Save changes",
          cancel:
            "Cancel",

          unknownVariant:
            "Unknown variant",
          unknownTarget:
            "Unknown target",
          unknownSupplier:
            "Unknown",
          genericSupplier:
            "supplier",

          days:
            "{count} days",

          supplierRequired:
            "A supplier is required.",
          targetInvalid:
            "The sourcing target is invalid.",
          moqInvalid:
            "MOQ must be at least 1.",

          duplicateAdd:
            "The supplier relation already exists or the target already has a preferred supplier.",
          duplicateEdit:
            "The target already has another preferred supplier.",

          addFailed:
            "Failed to add the supplier source. Please try again.",
          editFailed:
            "Failed to update the supplier source. Please try again.",
          deleteFailed:
            "Failed to delete the supplier source. Please try again.",

          relationNotEditable:
            "The supplier relation was not found or cannot be changed.",
          relationNotDeletable:
            "The supplier relation was not found or cannot be deleted.",

          deleteConfirm:
            "Delete the {supplier} relation from {target}?",
        },
      },

      variantInventory: {
        noOrganizationTitle:
          "Adjust Variant Stock",
        noOrganization:
          "No active organization was found.",
        title:
          "Variant Inventory",
        description:
          "Manage stock and low-stock alerts for this variant.",
      },
    },
    marketplaces: {
      title: "Marketplace Integration",
      description:
        "Manage marketplace channels and commerce mapping for the active organization.",
      noOrganization:
        "No active organization found.",

      accountManager: {
        validation: {
          required:
            "Provider and marketplace name are required.",
          alreadyRegistered:
            "That marketplace shop is already registered.",
          alreadyUsed:
            "That marketplace shop is already in use.",
          notFound:
            "Marketplace account was not found.",
        },

        connect: {
          title: "Connect Marketplace",
          description:
            "Add a marketplace shop or channel identity. API credentials are not stored here.",
          provider: "Provider",
          providerPlaceholder:
            "Shopee, Tokopedia, TikTok Shop...",
          accountName: "Account name",
          accountNamePlaceholder:
            "Example: Main Store",
          externalShopId: "External Shop ID",
          optional: "Optional",
          saving: "Saving...",
          addMarketplace: "Add marketplace",
        },

        accounts: {
          title: "Marketplace Accounts",
          countSuffix:
            "marketplace accounts found.",
          emptyTitle: "No marketplaces yet",
          emptyDescription:
            "Add a marketplace channel to start mapping.",
        },

        table: {
          marketplace: "Marketplace",
          provider: "Provider",
          shopId: "Shop ID",
          status: "Status",
          actions: "Actions",
        },

        statuses: {
          active: "Active",
          inactive: "Inactive",
          error: "Error",
        },

        actions: {
          open: "Open",
          edit: "Edit",
          delete: "Delete",
        },

        edit: {
          title: "Edit Marketplace",
          saving: "Saving...",
          saveChanges: "Save changes",
          cancel: "Cancel",
        },

        delete: {
          confirmPrefix: "Delete marketplace ",
          confirmSuffix:
            "? Listings, order links, and sync logs for this account will also be deleted.",
        },
      },
    },
    analytics: {
      title: "Analytics",
      description:
        "Product performance based on completed orders for the active organization.",
      noOrganization:
        "No active organization found.",

      emptySales: {
        title: "No completed sales yet",
        description:
          "Revenue, cost, profit, margin, and sales trends will be calculated from real orders after they reach completed status.",
      },

      metrics: {
        revenue: {
          label: "Revenue",
          description:
            "Completed sales only",
        },
        cost: {
          label: "Cost",
          description:
            "Historical cost snapshots",
        },
        grossProfit: {
          label: "Gross Profit",
          description:
            "Revenue minus historical cost",
        },
        grossMargin: {
          label: "Gross Margin",
          description:
            "Gross profit / revenue",
        },
        completedOrders: "Completed Orders",
        unitsSold: "Units Sold",
        productsSold: "Products Sold",
        averageOrderValue:
          "Average Order Value",
      },

      chart: {
        title: "Sales Trend",
        description:
          "Revenue and gross profit over the last 30 days",
        emptyTitle:
          "No completed sales yet",
        emptyDescription:
          "The trend will appear after an order reaches completed status.",
        revenueLabel: "Revenue",
        profitLabel: "Profit",
      },

      productPerformance: {
        title: "Product Performance",
        description:
          "Sales metrics use completed orders and historical cost.",
        empty:
          "No products found in the active organization.",

        columns: {
          product: "Product",
          sku: "SKU",
          units: "Units",
          revenue: "Revenue",
          cost: "Cost",
          profit: "Profit",
          margin: "Margin",
          stock: "Stock",
        },
      },
    },
  },
} as const;

export type Dictionary =
  (typeof dictionaries)[Locale];

export function getDictionary(
  locale: Locale
): Dictionary {
  return dictionaries[locale];
}
