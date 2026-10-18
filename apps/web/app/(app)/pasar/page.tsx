import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/sesi";
import { DaftarKampanye, bacaUrutan } from "@/components/daftar-kampanye";
import { Isi, KepalaHalaman, tombolPrimer } from "@/components/ui";

export default async function PasarPage({ searchParams }: { searchParams: { urut?: string } }) {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/pasar");
  const clipper = pengguna.peran === "editor";

  return (
    <>
      <KepalaHalaman
        id="judul-pasar"
        penanda={clipper ? "Clipper" : "Pasar proyek"}
        judul={clipper ? "Cari kampanye" : "Pasar proyek"}
        deskripsi="Kampanye terbuka dari kreator. Kamu bisa melamar maksimal 3 proyek aktif sekaligus."
        aksi={
          !clipper && (
            <a href="/kampanye/baru" className={tombolPrimer}>
              Buka kampanye baru
            </a>
          )
        }
      />
      <Isi>
        <DaftarKampanye basePath="/pasar" urut={bacaUrutan(searchParams.urut)} kosongUntukKreator={!clipper} />
      </Isi>
    </>
  );
}
