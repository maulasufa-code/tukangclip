import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { KampanyeForm } from "@/components/kampanye-form";

export default async function KampanyeBaruPage() {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/kampanye/baru");

  return (
    <section aria-labelledby="judul-baru">
      <h1 id="judul-baru" className="text-2xl font-bold">Kampanye baru</h1>
      <p className="mt-2 text-sm text-stone-700">
        Budget dicatat sebagai escrow terkunci. Gerak uang nyata via Xendit menyusul di Fase 7.
      </p>
      <KampanyeForm />
    </section>
  );
}
