import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { apiGet } from "@/lib/api";
import { LamarButton, DanaiButton, PutusanButtons, ReviewButtons, SengketaBox, TandaiPosted } from "@/components/pasar-actions";

interface App {
  id: string;
  editor_id: string;
  status: string;
  due_at: string | null;
}

export default async function KampanyePage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/kampanye/" + params.id);

  const c = await apiGet(`/campaigns/${params.id}`);
  if (!c) {
    return (
      <section>
        <h1 className="text-2xl font-bold">Kampanye</h1>
        <p className="mt-4 rounded-md border border-dashed p-6 text-sm">
          API backend belum tersambung.
        </p>
      </section>
    );
  }
  if (!c.id) redirect("/pasar");

  const mine = c.creator_id === user.id;
  const subs = mine ? await apiGet(`/campaigns/${params.id}/submissions`).catch(() => null) : null;

  return (
    <section aria-labelledby="judul-kampanye">
      <h1 id="judul-kampanye" className="text-2xl font-bold">{c.title}</h1>
      <p className="mt-2 text-sm text-stone-700">{c.brief}</p>
      <p className="mt-1 text-sm text-stone-600">
        Budget Rp{(c.budget_total as number).toLocaleString("id-ID")} · Rp
        {(c.rate_per_1000_views as number).toLocaleString("id-ID")}/1.000 views ·
        maks Rp{(c.cap_per_clip as number).toLocaleString("id-ID")}/klip
      </p>
      {c.source_url && (
        <p className="mt-1 text-sm">
          Sumber: <a href={c.source_url as string} className="underline" target="_blank" rel="noreferrer">buka video mentah</a>
        </p>
      )}
      <div className="mt-4">
        <LamarButton campaignId={params.id} mine={mine} />
        {mine && <DanaiButton campaignId={params.id} />}
      </div>

      {mine && (
        <>
          <h2 className="mt-8 font-semibold">Pelamar ({(c.applications as App[]).length})</h2>
          {(c.applications as App[]).length === 0 ? (
            <p className="mt-1 text-sm text-stone-600">Belum ada pelamar.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {(c.applications as App[]).map((a) => (
                <li key={a.id} className="rounded-md border border-stone-200 p-3">
                  <p>Status: {a.status}{a.due_at ? ` · tenggat ${new Date(a.due_at).toLocaleString("id-ID")}` : ""}</p>
                  {a.status === "applied" && <div className="mt-2"><PutusanButtons appId={a.id} /></div>}
                </li>
              ))}
            </ul>
          )}
          <h2 className="mt-8 font-semibold">Submission masuk</h2>
          {!subs || subs.items.length === 0 ? (
            <p className="mt-1 text-sm text-stone-600">Belum ada submission.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {subs.items.map((s: { id: string; status: string; file_r2_key: string; flagged?: boolean }) => (
                <li key={s.id} className="rounded-md border border-stone-200 p-3">
                  <p>Status: {s.status} · {s.file_r2_key}</p>
                  {s.status === "submitted" && <div className="mt-2"><ReviewButtons subId={s.id} /></div>}
                  {s.status === "approved" && <TandaiPosted subId={s.id} />}
                  <SengketaBox subId={s.id} flagged={!!s.flagged} mine={mine} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
