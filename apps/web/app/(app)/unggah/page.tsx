import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/sesi";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Isi, KepalaHalaman } from "@/components/ui";

export default async function UnggahPage() {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/unggah");
  if (pengguna.peran === "editor") redirect("/dasbor");

  return (
    <>
      <KepalaHalaman
        id="judul-unggah"
        penanda="Jalur otomatis"
        judul="Unggah video panjang"
        deskripsi="MP4 sampai 2 GB, durasi sampai 30 menit. File dikirim langsung ke penyimpanan, tidak mampir ke server web."
      />
      <Isi className="max-w-3xl">
        <UploadDropzone />
      </Isi>
    </>
  );
}
