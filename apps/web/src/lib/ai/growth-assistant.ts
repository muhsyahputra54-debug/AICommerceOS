export const GROWTH_ASSISTANT_TASK_IDS = [
  "content-ideas",
  "seven-day-plan",
  "captions",
  "promo-ideas",
  "product-focus",
  "next-actions",
] as const;

export type GrowthAssistantTaskId =
  (typeof GROWTH_ASSISTANT_TASK_IDS)[number];

export type GrowthAssistantLocale =
  | "id"
  | "en";

type GrowthAssistantTask = {
  id: GrowthAssistantTaskId;
  title: {
    id: string;
    en: string;
  };
  description: {
    id: string;
    en: string;
  };
  instruction: {
    id: string;
    en: string;
  };
};

export const GROWTH_ASSISTANT_TASKS = [
  {
    id: "content-ideas",
    title: {
      id: "Ide Konten",
      en: "Content Ideas",
    },
    description: {
      id: "Cari ide konten organik yang relevan dengan bisnis dan produk Anda.",
      en: "Find organic content ideas relevant to your business and products.",
    },
    instruction: {
      id: "Buat ide konten organik yang praktis untuk produk dan kanal bisnis ini. Prioritaskan ide yang dapat dikerjakan tanpa iklan berbayar.",
      en: "Create practical organic content ideas for this business, its products, and channels. Prioritize ideas that can be executed without paid advertising.",
    },
  },
  {
    id: "seven-day-plan",
    title: {
      id: "Rencana 7 Hari",
      en: "7-Day Plan",
    },
    description: {
      id: "Susun rencana pemasaran organik yang sederhana untuk tujuh hari.",
      en: "Build a simple seven-day organic marketing plan.",
    },
    instruction: {
      id: "Susun rencana pemasaran organik untuk 7 hari. Berikan satu fokus utama per hari, tujuan singkat, ide konten, dan langkah yang dapat dilakukan pemilik usaha.",
      en: "Build a seven-day organic marketing plan. Give one primary focus per day, a short objective, a content idea, and an action the business owner can perform.",
    },
  },
  {
    id: "captions",
    title: {
      id: "Draft Caption",
      en: "Caption Drafts",
    },
    description: {
      id: "Buat beberapa draft caption yang masih dapat Anda edit sebelum dipublikasikan.",
      en: "Create caption drafts that you can review and edit before publishing.",
    },
    instruction: {
      id: "Buat beberapa draft caption organik berdasarkan konteks bisnis yang tersedia. Jangan mengklaim fakta produk, harga, promo, atau hasil yang tidak tersedia dalam data.",
      en: "Create several organic caption drafts using the available business context. Do not claim product facts, prices, promotions, or outcomes that are not present in the data.",
    },
  },
  {
    id: "promo-ideas",
    title: {
      id: "Ide Promosi",
      en: "Promotion Ideas",
    },
    description: {
      id: "Cari konsep promosi tanpa otomatis mengubah harga atau membuat campaign.",
      en: "Explore promotion concepts without changing prices or creating campaigns.",
    },
    instruction: {
      id: "Berikan ide promosi yang dapat dipertimbangkan pemilik bisnis. Ide harus bersifat draft dan tidak boleh mengubah harga, stok, marketplace, atau membuat campaign secara otomatis.",
      en: "Suggest promotion concepts the business owner can consider. The ideas must remain drafts and must not change prices, inventory, marketplace state, or create campaigns automatically.",
    },
  },
  {
    id: "product-focus",
    title: {
      id: "Fokus Produk",
      en: "Product Focus",
    },
    description: {
      id: "Gunakan bukti penjualan, margin, dan stok yang tersedia untuk memilih produk yang layak ditinjau.",
      en: "Use available sales, margin, and inventory evidence to identify products worth reviewing.",
    },
    instruction: {
      id: "Berdasarkan hanya data produk, penjualan, margin, dan stok yang benar-benar tersedia, jelaskan produk mana yang layak diprioritaskan untuk ditinjau dari sisi pemasaran. Pisahkan fakta dari rekomendasi dan jangan membuat forecast.",
      en: "Using only product, sales, margin, and inventory data that is actually available, explain which products are worth prioritizing for marketing review. Separate facts from recommendations and do not create forecasts.",
    },
  },
  {
    id: "next-actions",
    title: {
      id: "Langkah Growth Berikutnya",
      en: "Next Growth Actions",
    },
    description: {
      id: "Dapatkan beberapa langkah growth yang realistis dari kondisi bisnis saat ini.",
      en: "Get a small set of realistic growth actions based on the current business situation.",
    },
    instruction: {
      id: "Berikan maksimal tiga langkah growth berikutnya yang paling masuk akal berdasarkan konteks bisnis terverifikasi. Jelaskan alasan singkat dan apa yang harus diperiksa sebelum bertindak.",
      en: "Give at most three sensible next growth actions based on verified business context. Explain the short rationale and what should be checked before acting.",
    },
  },
] as const satisfies readonly GrowthAssistantTask[];

const MAX_OBJECTIVE_LENGTH =
  1600;

function normalizedObjective(
  value: string,
): string {
  return value
    .trim()
    .replace(
      /\s+/g,
      " ",
    )
    .slice(
      0,
      MAX_OBJECTIVE_LENGTH,
    );
}

function taskById(
  taskId: GrowthAssistantTaskId,
): GrowthAssistantTask {
  const task =
    GROWTH_ASSISTANT_TASKS.find(
      (candidate) =>
        candidate.id === taskId,
    );

  if (!task) {
    throw new Error(
      "Unsupported Growth Assistant task.",
    );
  }

  return task;
}

export function buildGrowthAssistantPrompt({
  taskId,
  objective,
  locale,
}: {
  taskId: GrowthAssistantTaskId;
  objective: string;
  locale: GrowthAssistantLocale;
}): string {
  const task =
    taskById(taskId);

  const brief =
    normalizedObjective(
      objective,
    );

  const languageInstruction =
    locale === "en"
      ? "Respond in English."
      : "Jawab dalam Bahasa Indonesia.";

  const taskInstruction =
    task.instruction[locale];

  const briefInstruction =
    brief
      ? locale === "en"
        ? `Additional user brief: ${brief}`
        : `Brief tambahan pengguna: ${brief}`
      : locale === "en"
        ? "No additional user brief was provided."
        : "Tidak ada brief tambahan dari pengguna.";

  return [
    "LAKUVO Growth Assistant V1.",
    "Act as an advisory growth assistant for a small or growing commerce business.",
    languageInstruction,
    "Use only the verified business context, business profile, sales intelligence, product performance, and inventory evidence supplied by LAKUVO.",
    "Do not invent unavailable products, prices, costs, inventory, sales, margin, customer facts, marketplace performance, competitor information, demand, forecasts, ROI, or causal claims.",
    "Clearly distinguish verified facts from recommendations, assumptions, and drafts.",
    "This workflow is advisory and draft-only.",
    "Do not publish or schedule content.",
    "Do not create advertisements or spend advertising budget.",
    "Do not connect, modify, or operate marketplace or social accounts.",
    "Do not change product names, prices, product status, inventory, orders, suppliers, or billing.",
    "Do not create, confirm, or execute controlled actions.",
    "If important data is unavailable, say what is unavailable instead of guessing.",
    `Growth task: ${taskInstruction}`,
    briefInstruction,
    "Keep the answer practical, concise, and suitable for a business owner. Give the highest-priority recommendation first.",
  ].join("\n");
}