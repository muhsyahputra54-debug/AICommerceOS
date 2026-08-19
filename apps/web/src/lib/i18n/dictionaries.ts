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
