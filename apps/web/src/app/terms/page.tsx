import type {
  Metadata,
} from "next";

import {
  PolicySection,
  PublicSiteShell,
} from "@/components/marketing/PublicSiteShell";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Syarat dan Ketentuan penggunaan layanan LAKUVO.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <PublicSiteShell
      eyebrow="Legal"
      title="Syarat & Ketentuan LAKUVO"
      description="Ketentuan ini mengatur penggunaan platform LAKUVO dan pembelian akses layanan berbayar."
    >
      <div className="max-w-4xl space-y-10">
        <p className="text-sm text-muted-foreground">
          Terakhir diperbarui:
          26 Agustus 2026
        </p>

        <PolicySection title="1. Tentang LAKUVO">
          <p>
            LAKUVO adalah layanan teknologi
            informasi berbasis
            Software-as-a-Service (SaaS)
            untuk membantu bisnis mengelola
            operasi commerce, termasuk
            produk, pesanan, inventori,
            marketplace, analitik,
            automasi, dan kapabilitas AI.
          </p>
        </PolicySection>

        <PolicySection title="2. Akun dan akses">
          <p>
            Pengguna bertanggung jawab
            menjaga keamanan akun,
            informasi autentikasi, serta
            aktivitas yang dilakukan melalui
            akun dan organisasi yang
            dimilikinya.
          </p>

          <p>
            Pengguna wajib memberikan
            informasi yang benar dan tidak
            menggunakan LAKUVO untuk
            aktivitas yang melanggar hukum,
            menipu, merugikan pihak lain,
            atau mengganggu keamanan
            layanan.
          </p>
        </PolicySection>

        <PolicySection title="3. Paket dan harga">
          <p>
            Informasi paket dan harga
            tersedia pada halaman Harga
            LAKUVO. Harga paket berbayar
            ditampilkan dalam Rupiah
            Indonesia (IDR).
          </p>

          <p>
            LAKUVO dapat memperbarui harga
            atau struktur paket untuk
            pembelian di masa mendatang.
            Harga yang berlaku untuk suatu
            transaksi adalah harga yang
            ditampilkan dan dikonfirmasi
            pada saat pembelian.
          </p>
        </PolicySection>

        <PolicySection title="4. Pembayaran dan periode akses">
          <p>
            Pembelian paket berbayar
            memberikan hak akses LAKUVO
            selama periode yang dipilih,
            misalnya bulanan atau tahunan.
          </p>

          <p>
            Implementasi pembayaran LAKUVO
            saat ini tidak secara otomatis
            membentuk kontrak recurring
            payment dengan penyedia
            pembayaran. Untuk melanjutkan
            akses setelah periode berakhir,
            pengguna dapat membeli periode
            berikutnya melalui checkout
            resmi LAKUVO.
          </p>

          <p>
            Status pembayaran dapat
            diverifikasi menggunakan catatan
            transaksi LAKUVO dan penyedia
            pembayaran yang digunakan.
          </p>
        </PolicySection>

        <PolicySection title="5. Penggunaan layanan">
          <p>
            Pengguna tidak boleh mencoba
            memperoleh akses tidak sah,
            mengganggu sistem, menyebarkan
            malware, menyalahgunakan API,
            melakukan otomatisasi yang
            merusak, atau menggunakan
            layanan untuk melanggar hak
            pihak lain.
          </p>
        </PolicySection>

        <PolicySection title="6. Ketersediaan dan perubahan layanan">
          <p>
            LAKUVO berupaya menjaga layanan
            tetap tersedia dan aman, namun
            pemeliharaan, kegagalan
            infrastruktur, perubahan
            integrasi pihak ketiga, atau
            keadaan di luar kendali yang
            wajar dapat menyebabkan
            gangguan sementara.
          </p>

          <p>
            Fitur dapat diperbarui,
            ditambah, atau disesuaikan
            untuk keamanan, keandalan,
            kebutuhan produk, dan
            kepatuhan.
          </p>
        </PolicySection>

        <PolicySection title="7. Hak kekayaan intelektual">
          <p>
            Hak atas perangkat lunak,
            merek, desain, dokumentasi, dan
            materi LAKUVO tetap menjadi
            milik pemegang haknya.
            Penggunaan layanan tidak
            memindahkan kepemilikan hak
            tersebut kepada pengguna.
          </p>
        </PolicySection>

        <PolicySection title="8. Refund dan pembatalan">
          <p>
            Pengembalian dana dan
            pembatalan mengikuti Kebijakan
            Refund & Pembatalan LAKUVO.
            Penghapusan akun atau berhenti
            menggunakan layanan tidak
            otomatis menghasilkan
            pengembalian dana.
          </p>
        </PolicySection>

        <PolicySection title="9. Data dan privasi">
          <p>
            Pemrosesan data pribadi dan
            informasi penggunaan dilakukan
            sesuai Kebijakan Privasi
            LAKUVO.
          </p>
        </PolicySection>

        <PolicySection title="10. Batas tanggung jawab">
          <p>
            Sejauh diizinkan oleh hukum,
            LAKUVO tidak bertanggung jawab
            atas kerugian tidak langsung
            yang timbul dari keputusan
            bisnis pengguna, data pihak
            ketiga, atau layanan eksternal
            yang berada di luar kendali
            LAKUVO.
          </p>
        </PolicySection>

        <PolicySection title="11. Hukum yang berlaku">
          <p>
            Ketentuan ini ditafsirkan
            sesuai hukum Republik Indonesia
            sepanjang hukum tersebut
            berlaku terhadap layanan dan
            transaksi terkait.
          </p>
        </PolicySection>

        <PolicySection title="12. Kontak">
          <p>
            Pertanyaan mengenai ketentuan
            ini dapat dikirim ke
            support@lakuvo.com.
          </p>
        </PolicySection>
      </div>
    </PublicSiteShell>
  );
}
