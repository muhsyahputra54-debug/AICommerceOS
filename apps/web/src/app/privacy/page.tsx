import type {
  Metadata,
} from "next";

import {
  PolicySection,
  PublicSiteShell,
} from "@/components/marketing/PublicSiteShell";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan Privasi LAKUVO mengenai pemrosesan data pengguna.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <PublicSiteShell
      eyebrow="Legal"
      title="Kebijakan Privasi LAKUVO"
      description="Kebijakan ini menjelaskan jenis data yang dapat diproses LAKUVO, tujuan penggunaannya, dan pilihan pengguna."
    >
      <div className="max-w-4xl space-y-10">
        <p className="text-sm text-muted-foreground">
          Terakhir diperbarui:
          26 Agustus 2026
        </p>

        <PolicySection title="1. Data yang dapat diproses">
          <p>
            LAKUVO dapat memproses data
            akun seperti nama, alamat
            email, informasi organisasi,
            serta data yang pengguna
            masukkan untuk menggunakan
            layanan.
          </p>

          <p>
            Dalam penggunaan fitur
            commerce, data dapat mencakup
            informasi produk, inventori,
            pesanan, pelanggan, supplier,
            marketplace, analitik, dan
            konfigurasi automasi yang
            diberikan oleh pengguna.
          </p>

          <p>
            LAKUVO juga dapat memproses
            informasi teknis dan keamanan
            seperti alamat IP, log
            permintaan, waktu akses,
            identifier sesi, perangkat,
            dan data diagnostik.
          </p>
        </PolicySection>

        <PolicySection title="2. Data pembayaran">
          <p>
            Untuk transaksi berbayar,
            LAKUVO dapat memproses metadata
            transaksi seperti paket,
            nominal, status pembayaran,
            referensi transaksi, dan waktu
            transaksi.
          </p>

          <p>
            Informasi pembayaran tertentu
            diproses oleh penyedia
            pembayaran yang digunakan dalam
            checkout dan tunduk pada
            kebijakan serta standar
            keamanan penyedia tersebut.
          </p>
        </PolicySection>

        <PolicySection title="3. Tujuan penggunaan data">
          <p>
            Data digunakan untuk
            menyediakan layanan,
            autentikasi, pengelolaan akun
            dan organisasi, menjalankan
            fitur commerce, memproses
            transaksi, memberikan dukungan,
            menjaga keamanan, mencegah
            penyalahgunaan, memperbaiki
            keandalan, serta memenuhi
            kewajiban hukum yang berlaku.
          </p>
        </PolicySection>

        <PolicySection title="4. Penyedia layanan">
          <p>
            LAKUVO dapat menggunakan
            penyedia infrastruktur,
            hosting, database, autentikasi,
            observability, komunikasi, dan
            pembayaran untuk menjalankan
            layanan.
          </p>

          <p>
            Data dibagikan kepada penyedia
            tersebut hanya sejauh diperlukan
            untuk fungsi yang mereka
            jalankan atau ketika diwajibkan
            oleh hukum.
          </p>
        </PolicySection>

        <PolicySection title="5. Cookie dan penyimpanan lokal">
          <p>
            LAKUVO dapat menggunakan
            cookie atau penyimpanan lokal
            untuk autentikasi, keamanan
            sesi, preferensi tampilan, dan
            fungsi penting aplikasi.
          </p>
        </PolicySection>

        <PolicySection title="6. Keamanan">
          <p>
            LAKUVO menerapkan pengamanan
            teknis dan organisasi yang
            wajar untuk membatasi akses
            tidak sah, perubahan,
            kehilangan, atau penyalahgunaan
            data.
          </p>

          <p>
            Tidak ada sistem elektronik
            yang dapat dijamin bebas risiko
            sepenuhnya, sehingga pengguna
            juga bertanggung jawab menjaga
            kredensial akun dan perangkatnya.
          </p>
        </PolicySection>

        <PolicySection title="7. Penyimpanan dan penghapusan">
          <p>
            Data disimpan selama diperlukan
            untuk menyediakan layanan,
            menjaga keamanan dan audit,
            menyelesaikan transaksi dan
            sengketa, serta memenuhi
            kewajiban hukum yang berlaku.
          </p>

          <p>
            Permintaan terkait penghapusan
            atau koreksi data dapat diajukan
            melalui kontak dukungan dan
            akan ditangani dengan
            mempertimbangkan kewajiban
            penyimpanan yang berlaku.
          </p>
        </PolicySection>

        <PolicySection title="8. Hak dan permintaan pengguna">
          <p>
            Pengguna dapat menghubungi
            LAKUVO untuk meminta informasi,
            koreksi, atau penanganan lain
            atas data pribadi sesuai hak
            yang diberikan oleh peraturan
            yang berlaku.
          </p>
        </PolicySection>

        <PolicySection title="9. Perubahan kebijakan">
          <p>
            Kebijakan ini dapat diperbarui
            apabila terdapat perubahan
            layanan, teknologi, praktik
            keamanan, atau kewajiban hukum.
            Versi terbaru akan tersedia
            pada halaman ini.
          </p>
        </PolicySection>

        <PolicySection title="10. Kontak privasi">
          <p>
            Permintaan terkait privasi
            dapat dikirim ke
            support@lakuvo.com.
          </p>
        </PolicySection>
      </div>
    </PublicSiteShell>
  );
}
