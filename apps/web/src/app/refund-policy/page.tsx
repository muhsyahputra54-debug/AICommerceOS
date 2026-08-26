import type {
  Metadata,
} from "next";

import {
  PolicySection,
  PublicSiteShell,
} from "@/components/marketing/PublicSiteShell";

export const metadata: Metadata = {
  title: "Refund & Pembatalan",
  description:
    "Kebijakan pengembalian dana dan pembatalan paket LAKUVO.",
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyPage() {
  return (
    <PublicSiteShell
      eyebrow="Pembayaran"
      title="Kebijakan Refund & Pembatalan"
      description="LAKUVO adalah layanan digital berbasis periode akses. Kebijakan berikut menjelaskan kondisi evaluasi pengembalian dana dan penghentian akses."
    >
      <div className="max-w-4xl space-y-10">
        <p className="text-sm text-muted-foreground">
          Terakhir diperbarui:
          26 Agustus 2026
        </p>

        <PolicySection title="1. Prinsip umum">
          <p>
            Pembelian paket berbayar
            memberikan akses digital ke
            LAKUVO untuk periode yang
            dipilih. Refund tidak diberikan
            secara otomatis hanya karena
            pengguna berubah pikiran atau
            tidak menggunakan seluruh
            periode akses.
          </p>
        </PolicySection>

        <PolicySection title="2. Kondisi yang dapat dievaluasi untuk refund">
          <p>
            Permintaan refund dapat
            dievaluasi apabila terjadi
            pembayaran ganda untuk
            pembelian yang sama, pembayaran
            telah berhasil tetapi akses
            paket tidak dapat diaktifkan
            atau dipulihkan, terdapat
            kesalahan transaksi yang telah
            diverifikasi, atau pengembalian
            dana diwajibkan oleh hukum yang
            berlaku.
          </p>
        </PolicySection>

        <PolicySection title="3. Kondisi yang umumnya tidak memenuhi refund">
          <p>
            Refund umumnya tidak diberikan
            atas perubahan keputusan setelah
            akses berhasil diberikan,
            ketidakaktifan pengguna, sisa
            periode yang tidak digunakan
            ketika layanan tersedia, atau
            penghentian akses akibat
            pelanggaran Syarat & Ketentuan,
            kecuali diwajibkan lain oleh
            hukum.
          </p>
        </PolicySection>

        <PolicySection title="4. Cara mengajukan permintaan">
          <p>
            Kirim permintaan ke
            support@lakuvo.com dengan
            mencantumkan email akun,
            organisasi terkait, tanggal
            transaksi, nominal, metode
            pembayaran, dan nomor referensi
            transaksi apabila tersedia.
          </p>

          <p>
            Jangan mengirim PIN, OTP, CVV,
            password, atau kredensial
            pembayaran sensitif melalui
            email.
          </p>
        </PolicySection>

        <PolicySection title="5. Verifikasi dan penyelesaian">
          <p>
            LAKUVO akan memverifikasi
            catatan transaksi dan status
            penyedia pembayaran sebelum
            menyetujui refund.
          </p>

          <p>
            Jika disetujui, pengembalian
            dana akan diproses melalui
            mekanisme yang tersedia pada
            penyedia pembayaran. Waktu dana
            diterima dapat bergantung pada
            penyedia pembayaran, bank,
            dompet digital, atau metode
            pembayaran yang digunakan.
          </p>
        </PolicySection>

        <PolicySection title="6. Pembatalan dan perpanjangan">
          <p>
            Implementasi pembayaran LAKUVO
            saat ini tidak secara otomatis
            membentuk kontrak recurring
            payment dengan penyedia
            pembayaran.
          </p>

          <p>
            Akses paket berbayar berlaku
            sampai akhir periode yang telah
            dibeli. Untuk melanjutkan
            penggunaan paket berbayar,
            pengguna dapat membeli periode
            berikutnya melalui checkout
            resmi LAKUVO.
          </p>
        </PolicySection>

        <PolicySection title="7. Penghapusan akun">
          <p>
            Penghapusan akun atau berhenti
            menggunakan LAKUVO tidak
            otomatis menghasilkan
            pengembalian dana atas periode
            yang telah dibeli.
          </p>
        </PolicySection>

        <PolicySection title="8. Kontak">
          <p>
            Semua pertanyaan mengenai
            pembayaran, refund, atau
            pembatalan dapat dikirim ke
            support@lakuvo.com.
          </p>
        </PolicySection>
      </div>
    </PublicSiteShell>
  );
}
