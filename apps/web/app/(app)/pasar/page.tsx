import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { apiGet } from "@/lib/api";

export default async function PasarPage() {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/pasar");
  const data = await apiGet("/campaigns");

  return (
    <section aria-labelledby="judul-pasar">
      <h1 id="judul-pasar" className="text-2xl font-bold">
        Pasar proyek
      </h1>
      <p className="mt-2 text-sm text-stone-700">
        Kampanye terbuka dari kreator. Lamar maksimal 3 proyek aktif.
      </p>
      <div className="mt-4">
        <a href="/kampanye/baru" className="min-h-[44px] inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm text-white">
          Buat kampanye
        </a>
      </div>
      {!data ? (
        <p className="mt-6 rounded-md border border-dashed p-6 text-sm text-stone-700">
          API backend belum tersambung. Isi NEXT_PUBLIC_API_URL untuk melihat pasar.
        </p>
      ) : data.items.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed p-6 text-sm text-stone-700">
          Belum ada kampanye terbuka. Jadilah yang pertama membuatnya.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.items.map((c: { id: string; title: string; budget_total: number; rate_per_1000_views: number }) => (
            <li key={c.id} className="rounded-md border border-stone-200 p-4">
              <a href={`/kampanye/${c.id}`} className="font-medium underline">
                {c.title}
              </a>
              <p className="mt-1 text-sm text-stone-600">
                Budget Rp{c.budget_total.toLocaleString("id-ID")} · Rp
                {c.rate_per_1000_views.toLocaleString("id-ID")}/1.000 views
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
