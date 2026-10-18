import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/sesi";
import { MfaBox, RekeningForm } from "@/components/keamanan-forms";
import { Isi, Judul2, KepalaHalaman } from "@/components/ui";

export default async function KeamananPage() {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/keamanan");

  return (
    <>
      <KepalaHalaman
        id="judul-aman"
        penanda="Keamanan"
        judul="Keamanan dan pencairan"
        deskripsi="Pasang verifikasi dua langkah dan daftarkan rekening sebelum bayaran bisa dicairkan."
      />
      <Isi className="max-w-3xl space-y-12">
        <section aria-labelledby="judul-mfa">
          <Judul2 id="judul-mfa">Verifikasi dua langkah</Judul2>
          <MfaBox />
        </section>
        <section aria-labelledby="judul-rekening">
          <Judul2 id="judul-rekening">Rekening payout</Judul2>
          <p className="mt-2 text-sm text-stone-700">
            Nomor tersimpan terenkripsi di server. Mengganti rekening me-reset status verifikasi.
          </p>
          <RekeningForm />
        </section>
      </Isi>
    </>
  );
}
