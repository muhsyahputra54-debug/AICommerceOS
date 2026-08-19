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
        lakuvoAi: "LAKUVO AI",
        aiAssistant: "Asisten AI",
        aiAgents: "Agen AI",
        products: "Produk",
        marketplaces: "Marketplace",
        productResearch: "Riset Produk",
        orders: "Pesanan",
        customers: "Pelanggan",
        suppliers: "Pemasok",
        analytics: "Analitik",
        analyticsOverview: "Ringkasan",
        analyticsIntelligence: "Wawasan",
        settings: "Pengaturan",
      },

      closeNavigation: "Tutup navigasi",
      closeSidebar: "Tutup sidebar",
    },

    aiAssistant: {
      title: "Asisten AI",
      description:
        "Asisten AI untuk membantu mengelola dan menganalisis bisnis Anda.",

      assistant: {
        title: "Asisten AI Commerce",
        status:
          "Siap membantu bisnis Anda.",
      },

      workspace: {
        title:
          "Asisten Bisnis AI Anda",
        description:
          "Asisten AI akan membantu Anda menganalisis penjualan, memahami pelanggan, mengelola produk, dan menjalankan automasi bisnis.",
      },

      inputPlaceholder:
        "Antarmuka chat AI akan tersedia pada tahap berikutnya...",
    },

    agents: {
      page: {
        title: "Agen AI",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Agen intelijen bisnis hanya-baca dengan konteks terkontrol dan rekomendasi yang dapat diaudit.",

        errors: {
          loadFailed:
            "Gagal memuat data Agen AI. Silakan coba lagi.",
        },
      },

      manager: {
        stats: {
          agents: "Agen AI",
          active: "Aktif",
          runs: "Eksekusi Agen",
        },

        create: {
          title: "Buat Agen AI",
          description:
            "Agen menerima konteks bisnis hanya-baca dan menghasilkan rekomendasi. Agen tidak dapat menjalankan perubahan pada data bisnis.",
          namePlaceholder:
            "Nama agen",
          purposePlaceholder:
            "Tujuan",
          modelPlaceholder:
            "Model khusus (opsional)",
          instructionsPlaceholder:
            "Instruksi tambahan untuk agen (opsional)",
          creating:
            "Membuat...",
          create:
            "Buat Agen",
        },

        empty:
          "Belum ada Agen AI.",

        statuses: {
          active: "Aktif",
          inactive: "Tidak aktif",
          pending: "Menunggu",
          running: "Berjalan",
          completed: "Selesai",
          failed: "Gagal",
          cancelled: "Dibatalkan",
        },

        contextsLabel:
          "Konteks",

        contexts: {
          products: "Produk",
          productResearch:
            "Riset Produk",
          priceMonitoring:
            "Pemantauan Harga",
          automation:
            "Otomasi",
        },

        actions: {
          pause: "Jeda",
          activate: "Aktifkan",
          delete: "Hapus",
        },

        run: {
          objectivePlaceholder:
            "Apa yang perlu dianalisis agen ini?",
          running:
            "Menjalankan...",
          run:
            "Jalankan Agen",
        },

        latest: {
          title:
            "Eksekusi Terbaru",
          auditSteps:
            "langkah audit",
          objective:
            "Tujuan",
          summary:
            "Ringkasan",
          recommendation:
            "Rekomendasi",
          risks:
            "Risiko",
          nextActions:
            "Tindakan Berikutnya",
          error:
            "Error",
        },

        history: {
          title:
            "Riwayat Eksekusi Agen",
          empty:
            "Belum ada riwayat eksekusi agen.",
          unknownAgent:
            "Tidak diketahui",

          columns: {
            time: "Waktu",
            agent: "Agen",
            status: "Status",
            model: "Model",
            steps: "Langkah",
          },
        },

        messages: {
          createSuccess:
            "Agen AI berhasil dibuat.",
          createFailed:
            "Gagal membuat Agen AI. Silakan coba lagi.",
          runSuccess:
            "Eksekusi Agen AI selesai.",
          runFailed:
            "Gagal menjalankan Agen AI. Periksa konfigurasi atau batas penggunaan lalu coba lagi.",
          toggleFailed:
            "Gagal mengubah status Agen AI. Silakan coba lagi.",
          deleteFailed:
            "Gagal menghapus Agen AI. Silakan coba lagi.",
        },

        deleteConfirm:
          "Hapus Agen AI \"{name}\" beserta seluruh riwayat eksekusinya?",
      },
    },

    orders: {
      list: {
        title: "Pesanan",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Kelola dan pantau seluruh pesanan bisnis Anda.",
        addOrder: "Tambah Pesanan",
        managementTitle:
          "Manajemen Pesanan",
        managementCountSuffix:
          "pesanan pada organisasi aktif.",
        emptyTitle:
          "Belum ada pesanan",
        emptyDescription:
          "Pesanan yang dibuat nanti akan tampil di sini.",

        columns: {
          order: "Pesanan",
          customer: "Pelanggan",
          total: "Total",
          status: "Status",
          created: "Dibuat",
          actions: "Aksi",
        },
      },

      statuses: {
        pending: "Tertunda",
        processing: "Diproses",
        completed: "Selesai",
        cancelled: "Dibatalkan",
      },

      errors: {
        loadFailed:
          "Gagal memuat data pesanan. Silakan coba lagi.",
      },

      newOrder: {
        title: "Tambah Pesanan",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Buat pesanan baru untuk organisasi aktif.",

        errors: {
          loadDependencies:
            "Gagal memuat data pendukung pesanan. Silakan coba lagi.",
        },

        form: {
          notices: {
            customerRequired:
              "Tambahkan minimal satu pelanggan sebelum membuat pesanan.",
            productRequired:
              "Tambahkan minimal satu produk aktif sebelum membuat pesanan.",
          },

          validation: {
            customerRequired:
              "Pilih pelanggan terlebih dahulu.",
            itemInvalid:
              "Setiap item harus memiliki produk dan jumlah lebih dari 0.",
            variantMismatch:
              "Varian tidak sesuai dengan produk yang dipilih.",
          },

          errors: {
            createFailed:
              "Gagal membuat pesanan. Silakan coba lagi.",
          },

          customerLabel: "Pelanggan",
          selectCustomer:
            "Pilih pelanggan",

          itemsTitle:
            "Item Pesanan",
          itemsDescription:
            "Harga final dan total dihitung ulang oleh database.",
          addItem:
            "Tambah item",

          productLabel: "Produk",
          selectProduct:
            "Pilih produk",
          stockLabel: "stok",

          variantLabel: "Varian",
          baseProduct:
            "Produk utama",
          noVariant:
            "Tidak ada varian",
          baseProductHelp:
            "Pilih Produk utama untuk menggunakan harga dan stok produk utama.",

          quantityLabel: "Jumlah",
          remove: "Hapus",

          estimatedTotal:
            "Perkiraan Total",
          finalTotalNote:
            "Nilai final tetap dihitung di server saat pesanan dibuat.",

          creating:
            "Membuat...",
          createOrder:
            "Buat Pesanan",
        },
      },

      statusActions: {
        cancelConfirm:
          "Batalkan pesanan ini? Perubahan status akan mengikuti aturan inventaris yang berlaku.",
        final: "Final",
        updating:
          "Memperbarui...",
        process: "Proses",
        complete: "Selesaikan",
        cancel: "Batalkan",

        errors: {
          updateFailed:
            "Gagal memperbarui status pesanan. Silakan coba lagi.",
        },
      },
    },

    customers: {
      list: {
        title: "Pelanggan",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Kelola dan pantau pelanggan bisnis Anda.",
        managementTitle:
          "Manajemen Pelanggan",
        managementCountSuffix:
          "pelanggan pada organisasi aktif.",
        addCustomer:
          "Tambah Pelanggan",
        emptyTitle:
          "Belum ada pelanggan",
        emptyDescription:
          "Pelanggan yang ditambahkan nanti akan tampil di sini.",

        columns: {
          customer: "Pelanggan",
          email: "Email",
          phone: "Telepon",
          added: "Ditambahkan",
          actions: "Aksi",
        },

        edit: "Edit",

        errors: {
          loadFailed:
            "Gagal memuat data pelanggan. Silakan coba lagi.",
        },
      },

      newCustomer: {
        title: "Tambah Pelanggan",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Tambahkan pelanggan baru ke organisasi aktif.",
      },

      editCustomer: {
        title: "Edit Pelanggan",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Perbarui informasi pelanggan pada organisasi aktif.",

        errors: {
          loadFailed:
            "Gagal memuat data pelanggan. Silakan coba lagi.",
        },
      },

      form: {
        nameLabel:
          "Nama pelanggan",
        namePlaceholder:
          "Contoh: Budi Santoso",

        emailLabel:
          "Email",
        emailPlaceholder:
          "customer@example.com",

        phoneLabel:
          "Telepon",
        phonePlaceholder:
          "+62 812 3456 7890",

        cancel: "Batal",
        saving: "Menyimpan...",
        saveCustomer:
          "Simpan pelanggan",
        saveChanges:
          "Simpan perubahan",

        validation: {
          nameRequired:
            "Nama pelanggan wajib diisi.",
        },

        errors: {
          createFailed:
            "Gagal menambahkan pelanggan. Silakan coba lagi.",
          updateFailed:
            "Gagal memperbarui pelanggan. Silakan coba lagi.",
          notFoundOrCannotUpdate:
            "Pelanggan tidak ditemukan atau tidak dapat diperbarui.",
        },
      },

      delete: {
        confirmPrefix:
          "Hapus pelanggan",
        confirmSuffix:
          "Tindakan ini tidak dapat dibatalkan.",
        deleting:
          "Menghapus...",
        delete:
          "Hapus",

        errors: {
          inUse:
            "Pelanggan tidak dapat dihapus karena sudah digunakan pada pesanan.",
          deleteFailed:
            "Gagal menghapus pelanggan. Silakan coba lagi.",
          notFoundOrCannotDelete:
            "Pelanggan tidak ditemukan atau tidak dapat dihapus.",
        },
      },
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

    suppliers: {
      list: {
        title: "Pemasok",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Kelola pemasok untuk organisasi aktif.",
        addSupplier:
          "Tambah Pemasok",
        managementTitle:
          "Manajemen Pemasok",
        managementCountSuffix:
          "pemasok pada organisasi aktif.",
        emptyTitle:
          "Belum ada pemasok",
        emptyDescription:
          "Pemasok yang ditambahkan nanti akan tampil di sini.",

        columns: {
          supplier: "Pemasok",
          contact: "Kontak",
          emailPhone: "Email / Telepon",
          status: "Status",
          added: "Ditambahkan",
          actions: "Aksi",
        },

        statuses: {
          active: "Aktif",
          inactive: "Tidak aktif",
        },

        edit: "Edit",

        errors: {
          loadFailed:
            "Gagal memuat data pemasok. Silakan coba lagi.",
        },
      },

      newSupplier: {
        title: "Tambah Pemasok",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Tambahkan pemasok baru ke organisasi aktif.",
      },

      editSupplier: {
        title: "Edit Pemasok",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",
        description:
          "Perbarui informasi pemasok pada organisasi aktif.",

        errors: {
          loadFailed:
            "Gagal memuat data pemasok. Silakan coba lagi.",
        },
      },

      form: {
        nameLabel: "Nama pemasok",
        namePlaceholder:
          "Contoh: PT Pemasok Nusantara",

        contactLabel:
          "Kontak utama",
        contactPlaceholder:
          "Nama PIC pemasok",

        statusLabel: "Status",

        statuses: {
          active: "Aktif",
          inactive: "Tidak aktif",
        },

        emailLabel: "Email",
        emailPlaceholder:
          "supplier@example.com",

        phoneLabel: "Telepon",
        phonePlaceholder:
          "+62 812 3456 7890",

        addressLabel: "Alamat",
        addressPlaceholder:
          "Alamat pemasok",

        notesLabel: "Catatan",
        notesPlaceholder:
          "Catatan tambahan mengenai pemasok",

        cancel: "Batal",
        saving: "Menyimpan...",
        saveSupplier:
          "Simpan pemasok",
        saveChanges:
          "Simpan perubahan",

        validation: {
          nameRequired:
            "Nama pemasok wajib diisi.",
        },

        errors: {
          duplicateName:
            "Nama pemasok sudah digunakan pada organisasi ini.",
          createFailed:
            "Gagal menambahkan pemasok. Silakan coba lagi.",
          updateFailed:
            "Gagal memperbarui pemasok. Silakan coba lagi.",
          notFoundOrCannotUpdate:
            "Pemasok tidak ditemukan atau tidak dapat diperbarui.",
        },
      },

      delete: {
        confirmPrefix:
          "Hapus pemasok",
        confirmSuffix:
          "Tindakan ini tidak dapat dibatalkan.",
        deleting:
          "Menghapus...",
        delete:
          "Hapus",

        errors: {
          inUse:
            "Pemasok tidak dapat dihapus karena masih digunakan.",
          deleteFailed:
            "Gagal menghapus pemasok. Silakan coba lagi.",
          notFoundOrCannotDelete:
            "Pemasok tidak ditemukan atau tidak dapat dihapus.",
        },
      },
    },

    inventory: {
      title: "Wawasan Inventaris",
      noOrganization:
        "Organisasi aktif tidak ditemukan.",
      description:
        "Pantau kesehatan stok, nilai inventaris, potensi laba, peringatan, dan riwayat pergerakan untuk organisasi aktif.",
      productsLink: "Produk",

      productSection: {
        title: "Inventaris Produk",
        description:
          "Produk dan varian dihitung secara terpisah untuk mencegah penghitungan inventaris ganda.",
      },

      variantSection: {
        title: "Inventaris Varian",
        description:
          "Wawasan inventaris khusus untuk varian produk.",
      },

      metrics: {
        totalProducts: "Total Produk",
        activeSuffix: "aktif",
        totalProductStock: "Total Stok Produk",
        lowStock: "Stok Rendah",
        outOfStock: "Stok Habis",
        inventoryCost: "Biaya Inventaris",
        sellingValue: "Nilai Jual",
        potentialProfit: "Potensi Laba",
        stockHealth: "Kesehatan Stok",
        healthy: "Sehat",
        attention: "Perlu Perhatian",

        totalVariants: "Total Varian",
        totalVariantStock: "Total Stok Varian",
        lowStockVariants: "Varian Stok Rendah",
        outOfStockVariants: "Varian Stok Habis",
        variantCostValue: "Nilai Biaya Varian",
        variantSellingValue: "Nilai Jual Varian",
        variantPotentialProfit: "Potensi Laba Varian",
        variantStockHealth: "Kesehatan Stok Varian",
      },

      targetTypes: {
        product: "Produk",
        variant: "Varian",
      },

      stockStatuses: {
        low_stock: "Stok Rendah",
        out_of_stock: "Stok Habis",
      },

      alerts: {
        title: "Peringatan Stok",
        description:
          "Inventaris dengan stok habis atau stok rendah yang membutuhkan perhatian.",
        emptyTitle:
          "Tidak ada peringatan stok",
        emptyDescription:
          "Inventaris aktif saat ini berada di atas ambang stok rendah.",

        columns: {
          item: "Item",
          type: "Tipe",
          stock: "Stok",
          threshold: "Ambang",
          status: "Status",
          action: "Aksi",
        },

        noSku: "Tanpa SKU",
        manage: "Kelola",
      },

      movements: {
        title: "Pergerakan Inventaris",
        description:
          "50 pergerakan inventaris terbaru.",
        emptyTitle:
          "Belum ada pergerakan inventaris",
        emptyDescription:
          "Perubahan stok berikutnya akan tercatat di sini.",

        columns: {
          time: "Waktu",
          target: "Target",
          type: "Tipe",
          change: "Perubahan",
          before: "Sebelum",
          after: "Sesudah",
          reference: "Referensi",
          note: "Catatan",
        },

        deletedProduct:
          "Produk dihapus",
        deletedVariant:
          "Varian dihapus",
      },

      errors: {
        loadFailed:
          "Gagal memuat data inventaris. Silakan coba lagi.",
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
          supplier:
            "Supplier",
          target:
            "Target",
          supplierSku:
            "Supplier SKU",
          moq:
            "MOQ",
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

      detail: {
        page: {
          title: "Marketplace",
          noOrganization:
            "Organisasi aktif tidak ditemukan.",
          backToMarketplaces:
            "Kembali ke Marketplace",
          provider: "Provider",
          shop: "Toko",
        },

        manager: {
          common: {
            syncing: "Menyinkronkan...",
            processing: "Memproses...",
            status: "Status",
            actions: "Aksi",
            edit: "Edit",
            delete: "Hapus",
            cancel: "Batal",
            enabled: "Aktif",
            disabled: "Nonaktif",
            unknown: "Tidak diketahui",
            unknownProduct:
              "Produk tidak diketahui",
            unknownVariant:
              "Varian tidak diketahui",
            unknownTarget:
              "Target tidak diketahui",
            product: "Produk",
            variant: "Varian",
            active: "Aktif",
            inactive: "Tidak Aktif",
            error: "Error",
          },

          errors: {
            generic:
              "Operasi marketplace gagal. Silakan coba lagi.",
            syncAuthorizedShops:
              "Sinkronisasi toko terotorisasi gagal.",
            syncProductCatalog:
              "Sinkronisasi katalog produk gagal.",
            syncExternalOrders:
              "Sinkronisasi pesanan eksternal gagal.",
            processWebhook:
              "Rekonsiliasi webhook gagal.",
            customerRequired:
              "Pilih pelanggan internal sebelum membuat pesanan.",
            invalidListingTarget:
              "Target listing tidak valid.",
            listingAlreadyMapped:
              "Target atau listing eksternal tersebut sudah dipetakan.",
            externalListingIdUsed:
              "ID listing eksternal tersebut sudah digunakan.",
            listingNotFound:
              "Pemetaan listing tidak ditemukan.",
            orderFieldsRequired:
              "Pesanan internal dan ID Pesanan Eksternal wajib diisi.",
            orderAlreadyLinked:
              "Pesanan eksternal atau internal tersebut sudah terhubung.",
            externalOrderIdRequired:
              "ID Pesanan Eksternal wajib diisi.",
            externalOrderIdUsed:
              "ID Pesanan Eksternal tersebut sudah digunakan.",
            orderLinkNotFound:
              "Tautan pesanan tidak ditemukan.",
          },

          confirm: {
            createPendingOrder:
              "Buat pesanan internal berstatus pending dari pesanan eksternal",
            approveOrder:
              "Setujui pesanan internal",
            status: "status",
            basedOnMarketplaceStatus:
              "berdasarkan status marketplace",
            deleteMapping:
              "Hapus pemetaan",
            deleteOrderLink:
              "Hapus tautan pesanan",
          },

          connector: {
            title:
              "Konektor Tokopedia & Shop",
            description:
              "Otorisasi penjual ditangani di sisi server. Token akses dan refresh marketplace dienkripsi sebelum disimpan.",
            notConnected:
              "belum terhubung",
            accessTokenExpires:
              "Token akses kedaluwarsa",
            scopes: "scope",
            activateFirst:
              "Aktifkan akun marketplace ini sebelum menghubungkannya.",
            reconnect:
              "Hubungkan ulang Tokopedia & Shop",
            connect:
              "Hubungkan Tokopedia & Shop",
          },

          authorizedShops: {
            title: "Toko Terotorisasi",
            description:
              "Ambil daftar toko yang diotorisasi oleh koneksi penjual ini. Cipher toko tetap terenkripsi dan hanya tersedia di server.",
            syncAction:
              "Sinkronkan toko terotorisasi",
            connectFirst:
              "Hubungkan akun penjual sebelum mengambil toko terotorisasi.",
            empty:
              "Belum ada toko terotorisasi yang disinkronkan.",
            shop: "Toko",
            region: "Wilayah",
            sellerType: "Tipe penjual",
            mapping: "Pemetaan",
            selected: "Dipilih",
            useShop: "Gunakan toko ini",
            unavailable: "Tidak tersedia",
          },

          catalog: {
            title:
              "Katalog Produk Eksternal",
            description:
              "Katalog hanya-baca dari toko marketplace yang dipilih. Produk, varian, stok, dan pesanan internal tidak diubah.",
            syncAction:
              "Sinkronkan 100 produk pertama",
            selectShopFirst:
              "Pilih Toko Terotorisasi sebelum menyinkronkan produk.",
            empty:
              "Belum ada produk eksternal yang disinkronkan.",
            product: "Produk",
            skus: "SKU",
            lastSeen: "Terakhir terlihat",
            note:
              "M3 sengaja menyinkronkan satu halaman, maksimal 100 produk. Pagination akan diaktifkan setelah validasi runtime Partner Center pertama agar latensi API dan batas fungsi dapat diukur.",
          },

          externalOrders: {
            title: "Pesanan Eksternal",
            description:
              "Mirror operasional pesanan hanya-baca. Nama penerima pembeli, alamat, telepon, dan email sengaja tidak disimpan.",
            syncAction:
              "Sinkronkan pesanan terbaru",
            selectShopFirst:
              "Pilih Toko Terotorisasi sebelum menyinkronkan pesanan.",
            empty:
              "Belum ada pesanan eksternal yang disinkronkan.",
            externalOrder:
              "Pesanan Eksternal",
            amount: "Jumlah",
            items: "Item",
            internalLink:
              "Tautan Internal",
            bridge: "Bridge",
            updated: "Diperbarui",
            notLinked:
              "Belum ditautkan",
            alreadyLinked:
              "Sudah ditautkan",
            mappingIncomplete:
              "Pemetaan belum lengkap",
            mapped: "dipetakan",
            ambiguous: "ambigu",
            addCustomerFirst:
              "Tambahkan pelanggan internal terlebih dahulu",
            selectCustomer:
              "Pilih pelanggan",
            createPendingOrder:
              "Buat pesanan pending",
            note:
              "Pesanan eksternal tetap menjadi mirror hanya-baca. M7 hanya dapat membuat pesanan internal setelah setiap line item memiliki satu pemetaan Produk/Varian yang deterministik dan operator memilih pelanggan yang sudah ada. Pembuatan menggunakan RPC create_order yang dilindungi, sehingga pesanan internal baru tetap pending dan bridge ini tidak mengurangi stok.",
          },

          reconciliation: {
            title:
              "Rekonsiliasi Status Pesanan",
            description:
              "Perubahan status internal membutuhkan persetujuan manusia berdasarkan mirror pesanan marketplace yang telah direkonsiliasi. Setiap perubahan tetap menggunakan RPC update_order_status yang dilindungi.",
            emptyTitle:
              "Belum ada pesanan tertaut yang siap direkonsiliasi",
            emptyDescription:
              "Bridge pesanan eksternal ke pesanan internal terlebih dahulu.",
            externalOrder:
              "Pesanan Eksternal",
            marketplace: "Marketplace",
            internal: "Internal",
            proposal: "Usulan",
            reason: "Alasan",
            action: "Aksi",
            noAction:
              "Tidak ada aksi",
            approve: "Setujui",
            noApproval:
              "Tidak perlu persetujuan",
            note:
              "UNPAID dan ON_HOLD tidak memajukan status pesanan internal. Status fulfillment dapat memindahkan pending ke processing. DELIVERED tetap processing sampai marketplace COMPLETED. Pembatalan dapat memindahkan pending/processing ke cancelled. COMPLETED menggunakan dua langkah terkontrol jika pesanan internal masih pending.",
          },

          webhooks: {
            title: "Event Webhook",
            description:
              "Penerimaan terautentikasi dan idempoten dengan rekonsiliasi hanya-baca yang terkontrol. Payload mentah dan PII penerima tidak disimpan.",
            processAction:
              "Proses antrean webhook",
            emptyTitle:
              "Belum ada event webhook yang diterima",
            emptyDescription:
              "Konfigurasikan URL webhook staging di Partner Center setelah kredensial aplikasi tersedia.",
            received: "Diterima",
            type: "Tipe",
            entity: "Entitas",
            externalStatus:
              "Status Eksternal",
            processing: "Pemrosesan",
            attempts: "Percobaan",
          },

          listingMapping: {
            title:
              "Pemetaan Listing Produk",
            description:
              "Petakan Produk/Varian internal ke listing marketplace.",
            selectTarget:
              "Pilih Produk / Varian",
            externalListingId:
              "ID Listing Eksternal",
            externalSku:
              "SKU Eksternal",
            syncEnabled:
              "Sinkronisasi aktif",
            add:
              "Tambah pemetaan listing",
          },

          listings: {
            title: "Listing",
            countSuffix:
              "pemetaan ditemukan.",
            target: "Target",
            externalId:
              "ID Eksternal",
            externalSku:
              "SKU Eksternal",
            sync: "Sinkronisasi",
            editTitle:
              "Edit Pemetaan Listing",
            save: "Simpan listing",
          },

          orderLink: {
            title:
              "Tautan Pesanan Marketplace",
            description:
              "Hubungkan pesanan eksternal ke pesanan internal tanpa mengubah stok.",
            selectInternalOrder:
              "Pilih pesanan internal",
            externalOrderId:
              "ID Pesanan Eksternal",
            externalStatusOptional:
              "Status eksternal (opsional)",
            externalStatus:
              "Status eksternal",
            link:
              "Tautkan pesanan marketplace",
          },

          orderLinks: {
            title:
              "Tautan Pesanan",
            countSuffix:
              "tautan pesanan eksternal ditemukan.",
            externalOrder:
              "Pesanan Eksternal",
            internalOrder:
              "Pesanan Internal",
            internalStatus:
              "Status Internal",
            externalStatus:
              "Status Eksternal",
            editTitle:
              "Edit Tautan Pesanan",
            save:
              "Simpan tautan pesanan",
          },

          syncHistory: {
            title:
              "Riwayat Sinkronisasi",
            description:
              "Riwayat sinkronisasi marketplace bersifat append-only.",
            empty:
              "Belum ada aktivitas sinkronisasi",
            time: "Waktu",
            direction: "Arah",
            entity: "Entitas",
            operation: "Operasi",
            message: "Pesan",
          },
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

      intelligence: {
        title: "Analitik & Wawasan",
        description:
          "Kinerja perdagangan, inventaris, riset, pemantauan harga, otomasi, dan aktivitas AI selama 30 hari terakhir.",
        noOrganization:
          "Organisasi aktif tidak ditemukan.",

        errors: {
          loadFailed:
            "Gagal memuat data Analytics & Intelligence.",
          dataUnavailable:
            "Data Analytics & Intelligence tidak tersedia.",
        },

        metrics: {
          completedRevenue: "Pendapatan Selesai",
          completedOrdersSuffix: "pesanan selesai",
          grossProfit: "Laba Kotor",
          grossMarginSuffix: "margin kotor",
          averageOrderValue:
            "Rata-rata Nilai Pesanan",
          totalOrdersSuffix: "total pesanan",
          pendingAutomation:
            "Aksi Otomasi Tertunda",
          executedRunsSuffix:
            "eksekusi dijalankan",
        },

        salesTrend: {
          title: "Tren Penjualan",
          descriptionPrefix:
            "Aktivitas pesanan harian dan pendapatan selesai selama",
          descriptionSuffix:
            "hari terakhir.",
          generated: "Dibuat",
          orders: "pesanan",
        },

        orderIntelligence: {
          title: "Wawasan Pesanan",
          completed: "Selesai",
          processing: "Diproses",
          pending: "Tertunda",
          cancelled: "Dibatalkan",
          revenue: "Pendapatan",
          costOfGoods: "Biaya Barang",
          grossProfit: "Laba Kotor",
        },

        catalog: {
          title: "Katalog & Inventaris",
          products: "Produk",
          activeSuffix: "aktif",
          variants: "Varian",
          baseStock: "Stok Produk Dasar",
          variantStock: "Stok Varian",
          note:
            "Inventaris Produk Dasar dan Varian dilaporkan secara terpisah untuk mencegah penghitungan ganda.",
        },

        research: {
          title: "Riset Produk",
          totalCandidates:
            "Total kandidat",
          shortlisted:
            "Masuk shortlist",
          approved: "Disetujui",
          rejected: "Ditolak",
          averageOpportunity:
            "Rata-rata Peluang",
        },

        price: {
          title: "Wawasan Harga",
          monitorTargets:
            "Target pemantauan",
          activeTargets:
            "Target aktif",
          observations:
            "Observasi",
          thresholdAlerts:
            "Peringatan ambang",
        },

        automation: {
          title: "Otomasi",
          rules: "Aturan",
          activeRules:
            "Aturan aktif",
          executedRuns:
            "Eksekusi dijalankan",
          failedRuns:
            "Eksekusi gagal",
          pendingActions:
            "Aksi tertunda",
        },

        aiActivity: {
          title: "Aktivitas AI",
          description:
            "Aktivitas workflow terkait AI selama periode analitik yang dipilih.",
          researchAI:
            "AI Riset",
          descriptionAI:
            "AI Deskripsi",
          agentRuns:
            "Eksekusi Agent",
          agentCompleted:
            "Agent Selesai",
          agentFailed:
            "Agent Gagal",
        },

        readOnlyNote:
          "Analitik bersifat hanya-baca. Dashboard ini tidak mengubah Produk, Varian, Inventaris, Pesanan, Pemantauan Harga, Otomasi, atau status AI Agent.",
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
        lakuvoAi: "LAKUVO AI",
        aiAssistant: "AI Assistant",
        aiAgents: "AI Agents",
        products: "Products",
        marketplaces: "Marketplaces",
        productResearch: "Product Research",
        orders: "Orders",
        customers: "Customers",
        suppliers: "Suppliers",
        analytics: "Analytics",
        analyticsOverview: "Overview",
        analyticsIntelligence: "Intelligence",
        settings: "Settings",
      },

      closeNavigation: "Close navigation",
      closeSidebar: "Close sidebar",
    },

    aiAssistant: {
      title: "AI Assistant",
      description:
        "AI assistant to help manage and analyze your business.",

      assistant: {
        title: "AI Commerce Assistant",
        status:
          "Ready to assist your business.",
      },

      workspace: {
        title:
          "Your AI Business Assistant",
        description:
          "AI Assistant will help you analyze sales, understand customers, manage products, and run business automation.",
      },

      inputPlaceholder:
        "The AI chat interface will be available in the next phase...",
    },

    agents: {
      page: {
        title: "AI Agents",
        noOrganization:
          "No active organization found.",
        description:
          "Read-only commerce intelligence agents with controlled context and auditable recommendations.",

        errors: {
          loadFailed:
            "Failed to load AI Agent data. Please try again.",
        },
      },

      manager: {
        stats: {
          agents: "AI Agents",
          active: "Active",
          runs: "Agent Runs",
        },

        create: {
          title: "Create AI Agent",
          description:
            "Agents receive read-only commerce context and generate recommendations. They cannot execute commerce mutations.",
          namePlaceholder:
            "Agent name",
          purposePlaceholder:
            "Purpose",
          modelPlaceholder:
            "Model override (optional)",
          instructionsPlaceholder:
            "Additional agent instructions (optional)",
          creating:
            "Creating...",
          create:
            "Create Agent",
        },

        empty:
          "No AI Agents yet.",

        statuses: {
          active: "Active",
          inactive: "Inactive",
          pending: "Pending",
          running: "Running",
          completed: "Completed",
          failed: "Failed",
          cancelled: "Cancelled",
        },

        contextsLabel:
          "Context",

        contexts: {
          products: "Products",
          productResearch:
            "Product Research",
          priceMonitoring:
            "Price Monitoring",
          automation:
            "Automation",
        },

        actions: {
          pause: "Pause",
          activate: "Activate",
          delete: "Delete",
        },

        run: {
          objectivePlaceholder:
            "What should this agent analyze?",
          running:
            "Running...",
          run:
            "Run Agent",
        },

        latest: {
          title:
            "Latest Run",
          auditSteps:
            "audit steps",
          objective:
            "Objective",
          summary:
            "Summary",
          recommendation:
            "Recommendation",
          risks:
            "Risks",
          nextActions:
            "Next Actions",
          error:
            "Error",
        },

        history: {
          title:
            "Agent Run History",
          empty:
            "No agent runs.",
          unknownAgent:
            "Unknown",

          columns: {
            time: "Time",
            agent: "Agent",
            status: "Status",
            model: "Model",
            steps: "Steps",
          },
        },

        messages: {
          createSuccess:
            "AI agent created successfully.",
          createFailed:
            "Failed to create the AI agent. Please try again.",
          runSuccess:
            "AI agent run completed.",
          runFailed:
            "Failed to run the AI agent. Check configuration or usage limits and try again.",
          toggleFailed:
            "Failed to change the AI agent status. Please try again.",
          deleteFailed:
            "Failed to delete the AI agent. Please try again.",
        },

        deleteConfirm:
          "Delete AI agent \"{name}\" and its entire run history?",
      },
    },

    orders: {
      list: {
        title: "Orders",
        noOrganization:
          "No active organization found.",
        description:
          "Manage and monitor all of your business orders.",
        addOrder: "Add Order",
        managementTitle:
          "Order Management",
        managementCountSuffix:
          "orders in the active organization.",
        emptyTitle:
          "No orders yet",
        emptyDescription:
          "Orders you create will appear here.",

        columns: {
          order: "Order",
          customer: "Customer",
          total: "Total",
          status: "Status",
          created: "Created",
          actions: "Actions",
        },
      },

      statuses: {
        pending: "Pending",
        processing: "Processing",
        completed: "Completed",
        cancelled: "Cancelled",
      },

      errors: {
        loadFailed:
          "Failed to load orders. Please try again.",
      },

      newOrder: {
        title: "Add Order",
        noOrganization:
          "No active organization found.",
        description:
          "Create a new order for the active organization.",

        errors: {
          loadDependencies:
            "Failed to load order dependencies. Please try again.",
        },

        form: {
          notices: {
            customerRequired:
              "Add at least one customer before creating an order.",
            productRequired:
              "Add at least one active product before creating an order.",
          },

          validation: {
            customerRequired:
              "Select a customer first.",
            itemInvalid:
              "Every item must have a product and a quantity greater than 0.",
            variantMismatch:
              "The selected variant does not belong to the selected product.",
          },

          errors: {
            createFailed:
              "Failed to create the order. Please try again.",
          },

          customerLabel: "Customer",
          selectCustomer:
            "Select customer",

          itemsTitle:
            "Order Items",
          itemsDescription:
            "Final prices and totals are recalculated by the database.",
          addItem:
            "Add item",

          productLabel: "Product",
          selectProduct:
            "Select product",
          stockLabel: "stock",

          variantLabel: "Variant",
          baseProduct:
            "Base product",
          noVariant:
            "No variants",
          baseProductHelp:
            "Select Base product to use the main product price and stock.",

          quantityLabel: "Quantity",
          remove: "Remove",

          estimatedTotal:
            "Estimated Total",
          finalTotalNote:
            "The final value is still calculated server-side when the order is created.",

          creating:
            "Creating...",
          createOrder:
            "Create Order",
        },
      },

      statusActions: {
        cancelConfirm:
          "Cancel this order? The status transition will follow the applicable inventory rules.",
        final: "Final",
        updating:
          "Updating...",
        process: "Process",
        complete: "Complete",
        cancel: "Cancel",

        errors: {
          updateFailed:
            "Failed to update the order status. Please try again.",
        },
      },
    },

    customers: {
      list: {
        title: "Customers",
        noOrganization:
          "No active organization found.",
        description:
          "Manage and monitor your business customers.",
        managementTitle:
          "Customer Management",
        managementCountSuffix:
          "customers in the active organization.",
        addCustomer:
          "Add Customer",
        emptyTitle:
          "No customers yet",
        emptyDescription:
          "Customers you add will appear here.",

        columns: {
          customer: "Customer",
          email: "Email",
          phone: "Phone",
          added: "Added",
          actions: "Actions",
        },

        edit: "Edit",

        errors: {
          loadFailed:
            "Failed to load customers. Please try again.",
        },
      },

      newCustomer: {
        title: "Add Customer",
        noOrganization:
          "No active organization found.",
        description:
          "Add a new customer to the active organization.",
      },

      editCustomer: {
        title: "Edit Customer",
        noOrganization:
          "No active organization found.",
        description:
          "Update customer information in the active organization.",

        errors: {
          loadFailed:
            "Failed to load the customer. Please try again.",
        },
      },

      form: {
        nameLabel:
          "Customer name",
        namePlaceholder:
          "Example: Jane Doe",

        emailLabel:
          "Email",
        emailPlaceholder:
          "customer@example.com",

        phoneLabel:
          "Phone",
        phonePlaceholder:
          "+62 812 3456 7890",

        cancel: "Cancel",
        saving: "Saving...",
        saveCustomer:
          "Save customer",
        saveChanges:
          "Save changes",

        validation: {
          nameRequired:
            "Customer name is required.",
        },

        errors: {
          createFailed:
            "Failed to add the customer. Please try again.",
          updateFailed:
            "Failed to update the customer. Please try again.",
          notFoundOrCannotUpdate:
            "The customer was not found or could not be updated.",
        },
      },

      delete: {
        confirmPrefix:
          "Delete customer",
        confirmSuffix:
          "This action cannot be undone.",
        deleting:
          "Deleting...",
        delete:
          "Delete",

        errors: {
          inUse:
            "The customer cannot be deleted because it is already used by an order.",
          deleteFailed:
            "Failed to delete the customer. Please try again.",
          notFoundOrCannotDelete:
            "The customer was not found or could not be deleted.",
        },
      },
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

    suppliers: {
      list: {
        title: "Suppliers",
        noOrganization:
          "No active organization found.",
        description:
          "Manage suppliers for the active organization.",
        addSupplier:
          "Add Supplier",
        managementTitle:
          "Supplier Management",
        managementCountSuffix:
          "suppliers in the active organization.",
        emptyTitle:
          "No suppliers yet",
        emptyDescription:
          "Suppliers you add will appear here.",

        columns: {
          supplier: "Supplier",
          contact: "Contact",
          emailPhone: "Email / Phone",
          status: "Status",
          added: "Added",
          actions: "Actions",
        },

        statuses: {
          active: "Active",
          inactive: "Inactive",
        },

        edit: "Edit",

        errors: {
          loadFailed:
            "Failed to load suppliers. Please try again.",
        },
      },

      newSupplier: {
        title: "Add Supplier",
        noOrganization:
          "No active organization found.",
        description:
          "Add a new supplier to the active organization.",
      },

      editSupplier: {
        title: "Edit Supplier",
        noOrganization:
          "No active organization found.",
        description:
          "Update supplier information in the active organization.",

        errors: {
          loadFailed:
            "Failed to load the supplier. Please try again.",
        },
      },

      form: {
        nameLabel: "Supplier name",
        namePlaceholder:
          "Example: Nusantara Supply Co.",

        contactLabel:
          "Contact person",
        contactPlaceholder:
          "Supplier contact name",

        statusLabel: "Status",

        statuses: {
          active: "Active",
          inactive: "Inactive",
        },

        emailLabel: "Email",
        emailPlaceholder:
          "supplier@example.com",

        phoneLabel: "Phone",
        phonePlaceholder:
          "+62 812 3456 7890",

        addressLabel: "Address",
        addressPlaceholder:
          "Supplier address",

        notesLabel: "Notes",
        notesPlaceholder:
          "Additional notes about the supplier",

        cancel: "Cancel",
        saving: "Saving...",
        saveSupplier:
          "Save supplier",
        saveChanges:
          "Save changes",

        validation: {
          nameRequired:
            "Supplier name is required.",
        },

        errors: {
          duplicateName:
            "That supplier name is already used in this organization.",
          createFailed:
            "Failed to add the supplier. Please try again.",
          updateFailed:
            "Failed to update the supplier. Please try again.",
          notFoundOrCannotUpdate:
            "The supplier was not found or could not be updated.",
        },
      },

      delete: {
        confirmPrefix:
          "Delete supplier",
        confirmSuffix:
          "This action cannot be undone.",
        deleting:
          "Deleting...",
        delete:
          "Delete",

        errors: {
          inUse:
            "The supplier cannot be deleted because it is still in use.",
          deleteFailed:
            "Failed to delete the supplier. Please try again.",
          notFoundOrCannotDelete:
            "The supplier was not found or could not be deleted.",
        },
      },
    },

    inventory: {
      title: "Inventory Intelligence",
      noOrganization:
        "No active organization found.",
      description:
        "Monitor stock health, inventory value, profit potential, alerts, and movement history for the active organization.",
      productsLink: "Products",

      productSection: {
        title: "Product Inventory",
        description:
          "Products and variants are counted separately to prevent inventory double-counting.",
      },

      variantSection: {
        title: "Variant Inventory",
        description:
          "Inventory intelligence specifically for product variants.",
      },

      metrics: {
        totalProducts: "Total Products",
        activeSuffix: "active",
        totalProductStock: "Total Product Stock",
        lowStock: "Low Stock",
        outOfStock: "Out of Stock",
        inventoryCost: "Inventory Cost",
        sellingValue: "Selling Value",
        potentialProfit: "Potential Profit",
        stockHealth: "Stock Health",
        healthy: "Healthy",
        attention: "Attention",

        totalVariants: "Total Variants",
        totalVariantStock: "Total Variant Stock",
        lowStockVariants: "Low Stock Variants",
        outOfStockVariants: "Out of Stock Variants",
        variantCostValue: "Variant Cost Value",
        variantSellingValue: "Variant Selling Value",
        variantPotentialProfit: "Variant Potential Profit",
        variantStockHealth: "Variant Stock Health",
      },

      targetTypes: {
        product: "Product",
        variant: "Variant",
      },

      stockStatuses: {
        low_stock: "Low Stock",
        out_of_stock: "Out of Stock",
      },

      alerts: {
        title: "Stock Alerts",
        description:
          "Out-of-stock and low-stock inventory that requires attention.",
        emptyTitle:
          "No stock alerts",
        emptyDescription:
          "Active inventory is currently above its low-stock threshold.",

        columns: {
          item: "Item",
          type: "Type",
          stock: "Stock",
          threshold: "Threshold",
          status: "Status",
          action: "Action",
        },

        noSku: "No SKU",
        manage: "Manage",
      },

      movements: {
        title: "Inventory Movements",
        description:
          "The latest 50 inventory movements.",
        emptyTitle:
          "No inventory movements yet",
        emptyDescription:
          "Future stock changes will be recorded here.",

        columns: {
          time: "Time",
          target: "Target",
          type: "Type",
          change: "Change",
          before: "Before",
          after: "After",
          reference: "Reference",
          note: "Note",
        },

        deletedProduct:
          "Deleted product",
        deletedVariant:
          "Deleted variant",
      },

      errors: {
        loadFailed:
          "Failed to load inventory data. Please try again.",
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
          supplier:
            "Supplier",
          target:
            "Target",
          supplierSku:
            "Supplier SKU",
          moq:
            "MOQ",
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

      detail: {
        page: {
          title: "Marketplace",
          noOrganization:
            "No active organization found.",
          backToMarketplaces:
            "Back to Marketplaces",
          provider: "Provider",
          shop: "Shop",
        },

        manager: {
          common: {
            syncing: "Syncing...",
            processing: "Processing...",
            status: "Status",
            actions: "Actions",
            edit: "Edit",
            delete: "Delete",
            cancel: "Cancel",
            enabled: "Enabled",
            disabled: "Disabled",
            unknown: "Unknown",
            unknownProduct:
              "Unknown product",
            unknownVariant:
              "Unknown variant",
            unknownTarget:
              "Unknown target",
            product: "Product",
            variant: "Variant",
            active: "Active",
            inactive: "Inactive",
            error: "Error",
          },

          errors: {
            generic:
              "The marketplace operation failed. Please try again.",
            syncAuthorizedShops:
              "Authorized shop synchronization failed.",
            syncProductCatalog:
              "Product catalog synchronization failed.",
            syncExternalOrders:
              "External order synchronization failed.",
            processWebhook:
              "Webhook reconciliation failed.",
            customerRequired:
              "Select an internal customer before creating the order.",
            invalidListingTarget:
              "The listing target is invalid.",
            listingAlreadyMapped:
              "That target or external listing is already mapped.",
            externalListingIdUsed:
              "That external listing ID is already in use.",
            listingNotFound:
              "Listing mapping was not found.",
            orderFieldsRequired:
              "Internal order and External Order ID are required.",
            orderAlreadyLinked:
              "That external or internal order is already linked.",
            externalOrderIdRequired:
              "External Order ID is required.",
            externalOrderIdUsed:
              "That External Order ID is already in use.",
            orderLinkNotFound:
              "Order link was not found.",
          },

          confirm: {
            createPendingOrder:
              "Create an internal pending order from external order",
            approveOrder:
              "Approve internal order",
            status: "status",
            basedOnMarketplaceStatus:
              "based on marketplace status",
            deleteMapping:
              "Delete mapping",
            deleteOrderLink:
              "Delete order link",
          },

          connector: {
            title:
              "Tokopedia & Shop Connector",
            description:
              "Seller authorization is handled server-side. Marketplace access and refresh tokens are encrypted before storage.",
            notConnected:
              "not connected",
            accessTokenExpires:
              "Access token expires",
            scopes: "scope(s)",
            activateFirst:
              "Activate this marketplace account before connecting.",
            reconnect:
              "Reconnect Tokopedia & Shop",
            connect:
              "Connect Tokopedia & Shop",
          },

          authorizedShops: {
            title: "Authorized Shops",
            description:
              "Retrieve the shops authorized by this seller connection. Shop cipher remains encrypted and server-only.",
            syncAction:
              "Sync authorized shops",
            connectFirst:
              "Connect the seller account before retrieving authorized shops.",
            empty:
              "No authorized shop has been synchronized yet.",
            shop: "Shop",
            region: "Region",
            sellerType: "Seller type",
            mapping: "Mapping",
            selected: "Selected",
            useShop: "Use this shop",
            unavailable: "Unavailable",
          },

          catalog: {
            title:
              "External Product Catalog",
            description:
              "Read-only catalog from the selected marketplace shop. Internal products, variants, stock, and orders are not changed.",
            syncAction:
              "Sync first 100 products",
            selectShopFirst:
              "Select an Authorized Shop before syncing products.",
            empty:
              "No external product has been synchronized yet.",
            product: "Product",
            skus: "SKUs",
            lastSeen: "Last seen",
            note:
              "M3 intentionally synchronizes one page, up to 100 products. Pagination will be enabled after the first real Partner Center runtime validation so API latency and function limits can be measured.",
          },

          externalOrders: {
            title: "External Orders",
            description:
              "Read-only operational order mirror. Buyer recipient name, address, phone, and email are deliberately not persisted.",
            syncAction:
              "Sync recent orders",
            selectShopFirst:
              "Select an Authorized Shop before syncing orders.",
            empty:
              "No external order has been synchronized yet.",
            externalOrder:
              "External Order",
            amount: "Amount",
            items: "Items",
            internalLink:
              "Internal Link",
            bridge: "Bridge",
            updated: "Updated",
            notLinked:
              "Not linked",
            alreadyLinked:
              "Already linked",
            mappingIncomplete:
              "Mapping incomplete",
            mapped: "mapped",
            ambiguous: "ambiguous",
            addCustomerFirst:
              "Add an internal customer first",
            selectCustomer:
              "Select customer",
            createPendingOrder:
              "Create pending order",
            note:
              "External orders remain a read-only mirror. M7 can create an internal order only after every line item has one deterministic Product/Variant mapping and an operator explicitly selects an existing customer. Creation delegates to the protected create_order RPC, so the new internal order remains pending and no inventory is deducted by this bridge.",
          },

          reconciliation: {
            title:
              "Order Status Reconciliation",
            description:
              "Human-approved internal status transitions based on the reconciled marketplace order mirror. Every transition still delegates to the protected update_order_status RPC.",
            emptyTitle:
              "No linked order is ready for status reconciliation",
            emptyDescription:
              "Bridge an external order to an internal order first.",
            externalOrder:
              "External Order",
            marketplace: "Marketplace",
            internal: "Internal",
            proposal: "Proposal",
            reason: "Reason",
            action: "Action",
            noAction:
              "No action",
            approve: "Approve",
            noApproval:
              "No approval needed",
            note:
              "UNPAID and ON_HOLD do not advance the internal order. Fulfillment states can move pending to processing. DELIVERED stays processing until marketplace COMPLETED. Cancellation can move pending/processing to cancelled. COMPLETED uses two controlled steps when the internal order is still pending.",
          },

          webhooks: {
            title: "Webhook Events",
            description:
              "Authenticated, idempotent intake with controlled read-only reconciliation. Raw payload and recipient PII are not persisted.",
            processAction:
              "Process webhook queue",
            emptyTitle:
              "No webhook event received yet",
            emptyDescription:
              "Configure the staging webhook URL in Partner Center after app credentials are available.",
            received: "Received",
            type: "Type",
            entity: "Entity",
            externalStatus:
              "External Status",
            processing: "Processing",
            attempts: "Attempts",
          },

          listingMapping: {
            title:
              "Product Listing Mapping",
            description:
              "Map internal Product/Variant to the marketplace listing.",
            selectTarget:
              "Select Product / Variant",
            externalListingId:
              "External Listing ID",
            externalSku:
              "External SKU",
            syncEnabled:
              "Sync enabled",
            add:
              "Add listing mapping",
          },

          listings: {
            title: "Listings",
            countSuffix:
              "mappings found.",
            target: "Target",
            externalId:
              "External ID",
            externalSku:
              "External SKU",
            sync: "Sync",
            editTitle:
              "Edit Listing Mapping",
            save: "Save listing",
          },

          orderLink: {
            title:
              "Marketplace Order Link",
            description:
              "Link an external order to an internal order without changing stock.",
            selectInternalOrder:
              "Select internal order",
            externalOrderId:
              "External Order ID",
            externalStatusOptional:
              "External status (optional)",
            externalStatus:
              "External status",
            link:
              "Link marketplace order",
          },

          orderLinks: {
            title: "Order Links",
            countSuffix:
              "external order links found.",
            externalOrder:
              "External Order",
            internalOrder:
              "Internal Order",
            internalStatus:
              "Internal Status",
            externalStatus:
              "External Status",
            editTitle:
              "Edit Order Link",
            save:
              "Save order link",
          },

          syncHistory: {
            title:
              "Sync History",
            description:
              "Append-only marketplace synchronization history.",
            empty:
              "No sync activity yet",
            time: "Time",
            direction: "Direction",
            entity: "Entity",
            operation: "Operation",
            message: "Message",
          },
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

      intelligence: {
        title: "Analytics & Intelligence",
        description:
          "Commerce performance, inventory, research, price monitoring, automation, and AI activity for the last 30 days.",
        noOrganization:
          "No active organization found.",

        errors: {
          loadFailed:
            "Failed to load Analytics & Intelligence data.",
          dataUnavailable:
            "Analytics & Intelligence data is unavailable.",
        },

        metrics: {
          completedRevenue: "Completed Revenue",
          completedOrdersSuffix: "completed orders",
          grossProfit: "Gross Profit",
          grossMarginSuffix: "gross margin",
          averageOrderValue:
            "Average Order Value",
          totalOrdersSuffix: "total orders",
          pendingAutomation:
            "Pending Automation",
          executedRunsSuffix:
            "executed runs",
        },

        salesTrend: {
          title: "Sales Trend",
          descriptionPrefix:
            "Daily order activity and completed revenue during the last",
          descriptionSuffix:
            "days.",
          generated: "Generated",
          orders: "orders",
        },

        orderIntelligence: {
          title: "Order Intelligence",
          completed: "Completed",
          processing: "Processing",
          pending: "Pending",
          cancelled: "Cancelled",
          revenue: "Revenue",
          costOfGoods: "Cost of Goods",
          grossProfit: "Gross Profit",
        },

        catalog: {
          title: "Catalog & Inventory",
          products: "Products",
          activeSuffix: "active",
          variants: "Variants",
          baseStock: "Base Stock",
          variantStock: "Variant Stock",
          note:
            "Base Product and Variant inventory are intentionally reported separately to prevent accidental double-counting.",
        },

        research: {
          title: "Product Research",
          totalCandidates:
            "Total candidates",
          shortlisted: "Shortlisted",
          approved: "Approved",
          rejected: "Rejected",
          averageOpportunity:
            "Avg. Opportunity",
        },

        price: {
          title: "Price Intelligence",
          monitorTargets:
            "Monitor targets",
          activeTargets:
            "Active targets",
          observations:
            "Observations",
          thresholdAlerts:
            "Threshold alerts",
        },

        automation: {
          title: "Automation",
          rules: "Rules",
          activeRules: "Active rules",
          executedRuns:
            "Executed runs",
          failedRuns: "Failed runs",
          pendingActions:
            "Pending actions",
        },

        aiActivity: {
          title: "AI Activity",
          description:
            "AI-related workflow activity during the selected analytics period.",
          researchAI:
            "Research AI",
          descriptionAI:
            "Description AI",
          agentRuns: "Agent Runs",
          agentCompleted:
            "Agent Completed",
          agentFailed:
            "Agent Failed",
        },

        readOnlyNote:
          "Analytics is read-only. This dashboard does not mutate Products, Variants, Inventory, Orders, Price Monitoring, Automation, or AI Agent state.",
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
