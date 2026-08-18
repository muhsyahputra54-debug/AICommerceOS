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
  },
} as const;

export type Dictionary =
  (typeof dictionaries)[Locale];

export function getDictionary(
  locale: Locale
): Dictionary {
  return dictionaries[locale];
}
