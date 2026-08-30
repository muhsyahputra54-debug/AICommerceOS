import type {
  Locale,
} from "@/lib/i18n/config";

const copy = {
  id: {
    page: {
      title: "Riset Produk",
      description:
        "Riset kandidat produk, sinyal pasar, kompetisi, dan peluang sebelum produk masuk ke katalog.",
      organizationMissing:
        "Organisasi aktif tidak ditemukan.",
      back: "Kembali ke Riset Produk",
      detailDescription:
        "Riset produk, observasi pasar, dan analisis peluang berbantuan AI.",
    },
    manager: {
      addTitle: "Tambah Kandidat Riset",
      productCandidate: "Kandidat produk",
      category: "Kategori",
      marketplaceSource: "Marketplace / sumber",
      sourceMarketplace: "Marketplace sumber",
      sourceUrl: "URL sumber",
      observedPrice: "Harga teramati",
      estimatedCost: "Estimasi biaya",
      noLinkedProduct: "Tidak ada produk tertaut",
      demandScore: "Skor permintaan",
      competitionScore: "Skor kompetisi",
      opportunityScore: "Skor peluang",
      researchNotes: "Catatan riset",
      saving: "Menyimpan...",
      addCandidate: "Tambah kandidat",
      search:
        "Cari kandidat, kategori, marketplace...",
      allStatus: "Semua status",
      candidatesTitle: "Kandidat Riset",
      candidate: "Kandidat",
      source: "Sumber",
      price: "Harga",
      demand: "Permintaan",
      competition: "Kompetisi",
      opportunity: "Peluang",
      status: "Status",
      action: "Aksi",
      uncategorized: "Tanpa kategori",
      open: "Buka",
      empty: "Belum ada kandidat yang cocok.",
      nameRequired:
        "Nama kandidat produk wajib diisi.",
    },
    statuses: {
      researching: "Sedang diriset",
      shortlisted: "Masuk shortlist",
      approved: "Disetujui",
      rejected: "Ditolak",
      running: "Berjalan",
      completed: "Selesai",
      failed: "Gagal",
    },
    detail: {
      demandScore: "Skor Permintaan",
      competitionScore: "Skor Kompetisi",
      opportunityScore: "Skor Peluang",
      researching: "Sedang diriset",
      shortlist: "Masukkan shortlist",
      approve: "Setujui",
      reject: "Tolak",
      profileTitle: "Profil Riset",
      saveResearch: "Simpan riset",
      deleteCandidate: "Hapus kandidat",
      deleteCandidateConfirmPrefix:
        "Hapus riset",
      addObservation: "Tambah Observasi Pasar",
      sourceName: "Nama sumber",
      soldCount: "Jumlah terjual",
      rating: "Rating 0-5",
      reviewCount: "Jumlah ulasan",
      observationNote: "Catatan observasi",
      addObservationAction: "Tambah observasi",
      observationsTitle: "Observasi Pasar",
      observationCountSuffix: "observasi",
      observedAt: "Diamati",
      notes: "Catatan",
      delete: "Hapus",
      noObservations:
        "Belum ada observasi pasar.",
      deleteObservationConfirm:
        "Hapus observasi ini?",
      candidateNotFound:
        "Kandidat riset tidak ditemukan.",
      candidateNameRequired:
        "Nama kandidat wajib diisi.",
      observationSourceRequired:
        "Sumber observasi wajib diisi.",
      observationNotFound:
        "Observasi tidak ditemukan.",
    },
    ai: {
      title: "Riset Produk AI",
      description:
        "Analisis AI terhadap kandidat riset dan observasi pasar yang sudah tersedia.",
      analyzing: "Menganalisis...",
      run: "Jalankan Analisis AI",
      runComplete: "Analisis AI selesai.",
      runFailed:
        "Analisis AI gagal dijalankan.",
      genericFailure: "Analisis AI gagal.",
      applyComplete:
        "Skor AI diterapkan. Status kandidat tetap harus diputuskan pengguna.",
      advisoryNote:
        "Rekomendasi AI hanya bersifat saran. Menerapkan Skor AI hanya memperbarui skor; status kandidat tetap diputuskan pengguna.",
      latest: "Analisis AI Terbaru",
      applying: "Menerapkan...",
      applyScores: "Terapkan Skor AI",
      aiDemand: "Permintaan AI",
      aiCompetition: "Kompetisi AI",
      aiOpportunity: "Peluang AI",
      confidence: "Keyakinan",
      recommendation: "Rekomendasi",
      summary: "Ringkasan",
      rationale: "Alasan",
      risks: "Risiko",
      nextActions: "Tindakan Berikutnya",
      history: "Riwayat Analisis AI",
      noRuns: "Belum ada analisis AI.",
      noCompleted: "Belum ada analisis AI yang selesai.",
      runHint:
        "Jalankan analisis AI untuk mengevaluasi kandidat ini.",
      created: "Dibuat",
      model: "Model",
    },
    recommendations: {
      watch: "Pantau",
      shortlist: "Shortlist",
      approve: "Setujui",
      reject: "Tolak",
    },
  },
  en: {
    page: {
      title: "Product Research",
      description:
        "Research product candidates, market signals, competition, and opportunities before products enter the catalog.",
      organizationMissing:
        "Active organization was not found.",
      back: "Back to Product Research",
      detailDescription:
        "Product research, market observations, and AI-assisted opportunity analysis.",
    },
    manager: {
      addTitle: "Add Research Candidate",
      productCandidate: "Product candidate",
      category: "Category",
      marketplaceSource: "Marketplace / source",
      sourceMarketplace: "Source marketplace",
      sourceUrl: "Source URL",
      observedPrice: "Observed price",
      estimatedCost: "Estimated cost",
      noLinkedProduct: "No linked product",
      demandScore: "Demand score",
      competitionScore: "Competition score",
      opportunityScore: "Opportunity score",
      researchNotes: "Research notes",
      saving: "Saving...",
      addCandidate: "Add candidate",
      search:
        "Search candidate, category, marketplace...",
      allStatus: "All status",
      candidatesTitle: "Research Candidates",
      candidate: "Candidate",
      source: "Source",
      price: "Price",
      demand: "Demand",
      competition: "Competition",
      opportunity: "Opportunity",
      status: "Status",
      action: "Action",
      uncategorized: "Uncategorized",
      open: "Open",
      empty: "No matching candidates yet.",
      nameRequired:
        "Product candidate name is required.",
    },
    statuses: {
      researching: "Researching",
      shortlisted: "Shortlisted",
      approved: "Approved",
      rejected: "Rejected",
      running: "Running",
      completed: "Completed",
      failed: "Failed",
    },
    detail: {
      demandScore: "Demand Score",
      competitionScore: "Competition Score",
      opportunityScore: "Opportunity Score",
      researching: "Researching",
      shortlist: "Shortlist",
      approve: "Approve",
      reject: "Reject",
      profileTitle: "Research Profile",
      saveResearch: "Save research",
      deleteCandidate: "Delete candidate",
      deleteCandidateConfirmPrefix:
        "Delete research",
      addObservation: "Add Market Observation",
      sourceName: "Source name",
      soldCount: "Sold count",
      rating: "Rating 0-5",
      reviewCount: "Review count",
      observationNote: "Observation note",
      addObservationAction: "Add observation",
      observationsTitle: "Market Observations",
      observationCountSuffix: "observations",
      observedAt: "Observed",
      notes: "Notes",
      delete: "Delete",
      noObservations:
        "No market observations yet.",
      deleteObservationConfirm:
        "Delete this observation?",
      candidateNotFound:
        "Research candidate was not found.",
      candidateNameRequired:
        "Candidate name is required.",
      observationSourceRequired:
        "Observation source is required.",
      observationNotFound:
        "Observation was not found.",
    },
    ai: {
      title: "AI Product Research",
      description:
        "AI analysis of the available research candidate and market observations.",
      analyzing: "Analyzing...",
      run: "Run AI Analysis",
      runComplete: "AI analysis completed.",
      runFailed:
        "AI analysis could not be run.",
      genericFailure: "AI analysis failed.",
      applyComplete:
        "AI scores were applied. Candidate status must still be decided by the user.",
      advisoryNote:
        "AI recommendations are advisory only. Applying AI Scores only updates the scores; candidate status remains a user decision.",
      latest: "Latest AI Analysis",
      applying: "Applying...",
      applyScores: "Apply AI Scores",
      aiDemand: "AI Demand",
      aiCompetition: "AI Competition",
      aiOpportunity: "AI Opportunity",
      confidence: "Confidence",
      recommendation: "Recommendation",
      summary: "Summary",
      rationale: "Rationale",
      risks: "Risks",
      nextActions: "Next Actions",
      history: "AI Analysis History",
      noRuns: "No AI analysis yet.",
      noCompleted: "No completed AI analysis yet.",
      runHint:
        "Run AI analysis to evaluate this candidate.",
      created: "Created",
      model: "Model",
    },
    recommendations: {
      watch: "Watch",
      shortlist: "Shortlist",
      approve: "Approve",
      reject: "Reject",
    },
  },
} as const;

export function getProductResearchCopy(
  locale: Locale,
) {
  return copy[locale];
}

export function getProductResearchStatusLabel(
  locale: Locale,
  status: string,
) {
  const labels =
    copy[locale].statuses as Record<
      string,
      string
    >;

  return labels[status] ?? status;
}

export function getProductResearchRecommendationLabel(
  locale: Locale,
  recommendation: string | null,
) {
  if (!recommendation) {
    return "—";
  }

  const labels =
    copy[locale].recommendations as Record<
      string,
      string
    >;

  return labels[recommendation] ?? recommendation;
}