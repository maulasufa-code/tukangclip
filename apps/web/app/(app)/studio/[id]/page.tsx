import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { StudioEditor } from "@/components/studio-editor";

export default async function StudioPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/studio/" + params.id);

  const { data: job } = await supabase
    .from("ai_jobs")
    .select("id,status")
    .eq("id", params.id)
    .single();
  if (!job) redirect("/dasbor");

  const { data: plans } = await supabase
    .from("edit_plans")
    .select("version,plan")
    .eq("job_id", params.id)
    .order("version", { ascending: false })
    .limit(1);
  const { data: effects } = await supabase.from("effects").select("id,label");
  const { data: clips } = await supabase
    .from("clips")
    .select("r2_key")
    .eq("job_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const plan = plans?.[0]?.plan as {
    moments?: { start: number; end: number; hook: string; effects?: { effect_id: string; beat: number }[] }[];
    titles?: { youtube: string; tiktok: string; hashtags: string[] };
  } | null;

  if (!plan?.moments?.length) {
    return (
      <section aria-labelledby="judul-studio">
        <h1 id="judul-studio" className="text-2xl font-bold">Studio</h1>
        <div className="mt-4 rounded-md border border-dashed p-6 text-sm text-stone-700">
          Edit plan belum ada untuk pekerjaan ini. Tunggu worker analisis selesai,
          lalu muat ulang. Status: {job.status}.
        </div>
        <a href="/dasbor" className="mt-4 inline-block underline">Kembali ke dasbor</a>
      </section>
    );
  }

  return (
    <section aria-labelledby="judul-studio">
      <h1 id="judul-studio" className="text-2xl font-bold">Studio timeline</h1>
      <p className="mt-1 text-sm text-stone-600">
        Versi {plans?.[0]?.version ?? 1} · status {job.status}. Simpan membuat versi baru,
        render di server masuk antrean ulang.
      </p>
      <div className="mt-6">
        <StudioEditor
          jobId={params.id}
          initialMoments={plan.moments.map((m) => ({ ...m, effects: m.effects ?? [] }))}
          initialTitles={{
            youtube: plan.titles?.youtube ?? "",
            tiktok: plan.titles?.tiktok ?? "",
            hashtags: plan.titles?.hashtags ?? []
          }}
          effectIds={(effects ?? []).map((e) => ({ id: e.id, label: e.label }))}
          previewUrl=""
        />
      </div>
      {clips?.[0] ? (
        <p className="mt-4 text-sm text-stone-600">Base render tersedia: {clips[0].r2_key}.</p>
      ) : null}
    </section>
  );
}
