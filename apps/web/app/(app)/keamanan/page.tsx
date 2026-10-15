import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { MfaBox, RekeningForm } from "@/components/keamanan-forms";

export default async function KeamananPage() {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/keamanan");

  return (
    <section aria-labelledby="judul-aman">
      <h1 id="judul-aman" className="text-2xl font-bold">Keamanan dan pencairan</h1>
      <h2 className="mt-6 font-semibold">Verifikasi dua langkah</h2>
      <MfaBox />
      <h2 className="mt-8 font-semibold">Rekening payout</h2>
      <p className="mt-1 text-sm text-stone-600">
        Nomor tersimpan terenkripsi di server. Mengganti rekening me-reset status verifikasi.
      </p>
      <RekeningForm />
    </section>
  );
}
