import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/sesi";
import { KampanyeForm } from "@/components/kampanye-form";
import { Isi, KepalaHalaman } from "@/components/ui";

export default async function KampanyeBaruPage() {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/kampanye/baru");
  if (pengguna.peran === "editor") redirect("/dasbor");

  return (
    <>
      <KepalaHalaman
        id="judul-baru"
        penanda="Kreator"
        judul="Kampanye baru"
        deskripsi="Tulis brief, tentukan rate per 1.000 views, dan batasi bayaran per klip. Budget dibayar lewat Midtrans dan masuk escrow yang terkunci. Pencairan ke clipper belum aktif."
      />
      <Isi className="max-w-3xl">
        <KampanyeForm />
      </Isi>
    </>
  );
}
