import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { apiGet } from "@/lib/api";
import { KirimHasil } from "@/components/kirim-hasil";

export default async function KerjaankuPage() {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/kerjaanku");
  const data = await apiGet("/me/applications");

  return (
    <section aria-labelledby="judul-kerja">
      <h1 id="judul-kerja" className="text-2xl font-bold">Kerjaanku</h1>
      <p className="mt-2 text-sm text-stone-700">
        Proyek yang kamu lamar. Unggah hasil sebelum tenggat 72 jam.
      </p>
      {!data ? (
        <p className="mt-6 rounded-md border border-dashed p-6 text-sm">
          API backend belum tersambung.
        </p>
      ) : data.items.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed p-6 text-sm text-stone-700">
          Belum ada lamaran. Cari proyek di <a href="/pasar" className="underline">pasar</a>.
        </div>
      ) : (
        <ul className="mt-6 space-y-3 text-sm">
          {data.items.map((a: { id: string; campaign_id: string; status: string; due_at: string | null }) => (
            <li key={a.id} className="rounded-md border border-stone-200 p-4">
              <p>
                Status: {a.status}
                {a.due_at ? ` · tenggat ${new Date(a.due_at).toLocaleString("id-ID")}` : ""}
              </p>
              <a href={`/kampanye/${a.campaign_id}`} className="underline">Lihat kampanye</a>
              {a.status === "accepted" && <KirimHasil applicationId={a.id} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
