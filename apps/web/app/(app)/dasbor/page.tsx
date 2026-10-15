import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { JobStatus } from "@/components/job-status";

export default async function DasborPage() {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const { data: jobs } = await supabase
    .from("ai_jobs")
    .select("id,status,source_r2_key,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <section aria-labelledby="judul-dasbor">
      <h1 id="judul-dasbor" className="text-2xl font-bold">
        Pekerjaan saya
      </h1>
      <p className="mt-2 text-sm text-stone-700">
        {jobs && jobs.length > 0
          ? `${jobs.length} pekerjaan terakhir dari antrean AI.`
          : "Belum ada pekerjaan. Unggah video panjang untuk mulai."}
      </p>
      <div className="mt-4">
        <a
          href="/unggah"
          className="min-h-[44px] inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Unggah video baru
        </a>
      </div>
      {jobs && jobs.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-md border border-stone-200 p-4">
              <JobStatus id={j.id} status={j.status} r2key={j.source_r2_key} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-md border border-dashed p-6 text-sm text-stone-700">
          Kosong. Setelah unggah, status antrean muncul di sini dan
          diperbarui otomatis.
        </div>
      )}
    </section>
  );
}
