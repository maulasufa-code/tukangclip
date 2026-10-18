import type { Metadata } from "next";
import { DaftarKampanye, bacaUrutan } from "@/components/daftar-kampanye";
import { Isi, KepalaHalaman } from "@/components/ui";

export const metadata: Metadata = { title: "Kampanye yang sedang berjalan · TukangClip" };

export default function JelajahPage({ searchParams }: { searchParams: { urut?: string } }) {
  return (
    <>
      <KepalaHalaman
        id="judul-jelajah"
        penanda="Kampanye terbuka"
        judul="Kampanye yang sedang berjalan"
        deskripsi="Pilih kampanye, potong video mentahnya, lalu posting dari akunmu. Bayaran dihitung per 1.000 views. Untuk melamar, kamu perlu masuk sebagai clipper."
      />
      <Isi>
        <DaftarKampanye basePath="/jelajah" urut={bacaUrutan(searchParams.urut)} kosongUntukKreator />
      </Isi>
    </>
  );
}
