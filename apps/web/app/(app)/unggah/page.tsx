import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { UploadDropzone } from "@/components/upload-dropzone";

export default async function UnggahPage() {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/unggah");

  return (
    <section aria-labelledby="judul-unggah">
      <h1 id="judul-unggah" className="text-2xl font-bold">
        Unggah video panjang
      </h1>
      <p className="mt-2 text-sm text-stone-700">
        MP4 sampai 2 GB, durasi sampai 30 menit. File dikirim langsung ke
        penyimpanan, tidak mampir ke server web.
      </p>
      <div className="mt-6">
        <UploadDropzone />
      </div>
    </section>
  );
}
