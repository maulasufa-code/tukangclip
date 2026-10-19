import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { ambilPengguna } from "@/lib/sesi";
import { apiGet } from "@/lib/api";
import { ambilKampanye } from "@/lib/kampanye";
import { rupiah } from "@/lib/harga";
import { JobStatus } from "@/components/job-status";
import { GrafikPeriode } from "@/components/analytics-visual";
import { Chip, Isi, Kosong, angka, sisaWaktu, tanggal, tombolGelap, tombolPrimer, tombolSekunder } from "@/components/ui";

export const dynamic = "force-dynamic";

const LABEL_KAMPANYE: Record<string, string> = {
  draft: "Menunggu dana",
  open: "Terbuka",
  closed: "Ditutup",
  done: "Selesai"
};

const LABEL_LAMARAN: Record<string, string> = {
  applied: "Menunggu",
  accepted: "Diterima",
  rejected: "Ditolak",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan"
};

const LABEL_KLIP: Record<string, string> = {
  draft: "Perlu revisi",
  submitted: "Menunggu keputusan",
  approved: "Disetujui",
  rejected: "Ditolak",
  posted: "Disetujui",
  tracking: "Disetujui",
  paid_out: "Dibayar"
};

const NAMA_PLATFORM: Record<string, string> = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram" };
const SUDAH_TAYANG = ["posted", "tracking", "paid_out"];

type Kampanye = {
  id: string;
  title: string;
  status: string;
  budget_total: number;
  budget_remaining: number;
  rate_per_1000_views: number;
};

type Lamaran = {
  id: string;
  status: string;
  due_at: string | null;
  campaign: { id: string; title: string; rate_per_1000_views: number; budget_remaining: number } | null;
};

type Klip = { id: string; application_id: string; status: string; views_final: number | null };

type Papan = {
  papan: { rank: number; nama: string; clips: number; views: number; poin: number; saya: boolean }[];
  saya: { rank: number; nama: string; clips: number; views: number; poin: number; saya: boolean } | null;
  jumlah: number;
};

type Analitik = {
  totals: { views: number; estimate: number };
  platforms: { platform: string; views: number; videos: number }[];
  series: { date: string; views: number; likes: number; comments: number }[];
  videos: { submission_id: string; platform: string; url: string; judul: string; diunggah: string | null; views: number; likes: number; comments: number }[];
};

export default async function DasborPage() {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/dasbor");
  const nama = pengguna.nama || pengguna.email;

  return pengguna.peran === "editor" ? (
    <DasborClipper id={pengguna.id} nama={nama} />
  ) : (
    <DasborKreator id={pengguna.id} nama={nama} />
  );
}

async function DasborClipper({ id, nama }: { id: string; nama: string }) {
  const supabase = supabaseServer();
  const [{ data, error }, terbuka, sosial, analitik, statistik, papan] = await Promise.all([
    supabase
      .from("applications")
      .select("id,status,due_at,campaign:campaigns(id,title,rate_per_1000_views,budget_remaining)")
      .eq("editor_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    ambilKampanye("budget"),
    apiGet("/social"),
    apiGet("/analytics") as Promise<Analitik | null>,
    apiGet("/me/stats") as Promise<{ total_earned: number } | null>,
    apiGet("/leaderboard") as Promise<Papan | null>
  ]);
  const lamaran = (data ?? []) as unknown as Lamaran[];

  const idDiterima = lamaran.filter((l) => l.status === "accepted").map((l) => l.id);
  const { data: klipData } = idDiterima.length
    ? await supabase
        .from("submissions")
        .select("id,application_id,status,views_final")
        .in("application_id", idDiterima)
    : { data: [] as Klip[] };
  const klip = (klipData ?? []) as Klip[];

  const sudahKirim = new Set(klip.filter((k) => k.status !== "rejected").map((k) => k.application_id));
  const perluKirim = lamaran
    .filter((l) => l.status === "accepted" && !sudahKirim.has(l.id))
    .sort((a, b) => Date.parse(a.due_at ?? "") - Date.parse(b.due_at ?? ""));
  const sudahDilamar = new Set(lamaran.map((l) => l.campaign?.id));
  // Rekomendasi: kampanye terbuka yang belum dilamar, diurutkan dari sisa budget terbesar.
  // Rate sengaja tidak dijadikan urutan, supaya kampanye yang budgetnya masih aman yang muncul dulu.
  const rekomendasi = (terbuka ?? []).filter((k) => !sudahDilamar.has(k.id)).slice(0, 3);
  const akunTersambung = sosial ? (sosial.items as unknown[]).length : null;

  const platform = PLATFORM_URUT.map((p) => {
    const hit = analitik?.platforms.find((x) => x.platform === p);
    return { platform: p, views: hit?.views ?? 0, videos: hit?.videos ?? 0 };
  });
  const dibayar = statistik?.total_earned ?? null;
  const estimasi = analitik?.totals.estimate ?? null;

  return (
    <>
      <Hero
        penanda="Clipper"
        judul={
          <>
            Halo, <span className="text-cl-accent">{nama}</span>
          </>
        }
        deskripsi="Kirim klip sebelum tenggat, lalu cari kampanye berikutnya yang budgetnya masih aman."
        aksi={
          <>
            <a href="/pasar" className={tombolPrimer}>
              Cari kampanye
            </a>
            <a href="/analytics" className={tombolGelap}>
              Analytics
            </a>
          </>
        }
      />
      <Lembar>
        <Isi className="space-y-28">
          {error && (
            <Kosong gagal>
              Lamaranmu belum bisa dimuat ({error.message}). Muat ulang halaman ini sebentar lagi.
            </Kosong>
          )}

          <section aria-labelledby="judul-uang">
            <Eyebrow>Uang yang kamu dapat</Eyebrow>
            <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-end">
              <div>
                <p className="text-sm text-stone-700">Total sudah dibayar</p>
                <p className="mt-2 text-[clamp(56px,9vw,128px)] font-light leading-[0.95] tracking-[-0.04em] tabular-nums">
                  {dibayar === null ? "–" : rupiah(dibayar)}
                </p>
                <p className="mt-4 text-lg text-stone-700">
                  {estimasi === null
                    ? "Estimasi berjalan belum terbaca."
                    : `Estimasi dari klip yang masih berjalan: ${rupiah(estimasi)}, belum dibayar.`}
                </p>
              </div>

              <div className="space-y-4">
                <p className="font-mono text-xs uppercase text-stone-700">Views per platform, 30 hari terakhir</p>
                <dl className="grid grid-cols-3 divide-x divide-cl-ink/20 border-y border-cl-ink/20">
                  {platform.map((p) => (
                    <div key={p.platform} className="px-3 py-5 first:pl-0 last:pr-0">
                      <dt className="text-sm font-medium">{NAMA_PLATFORM[p.platform]}</dt>
                      <dd className="mt-2 text-[clamp(30px,3.6vw,48px)] font-light leading-none tracking-[-0.03em] tabular-nums">
                        {p.videos === 0 ? "–" : angka(p.views)}
                      </dd>
                      <dd className="mt-2 text-xs text-stone-700">
                        {p.videos === 0 ? "Belum ada klip" : `${angka(p.videos)} video`}
                      </dd>
                    </div>
                  ))}
                </dl>
                {analitik === null && <p className="text-sm text-stone-700">Analytics belum bisa dimuat.</p>}
                <a href="/analytics" className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase underline underline-offset-4">
                  Buka analytics lengkap
                </a>
              </div>
            </div>
            {analitik && analitik.series.length > 1 && (
              <div className="mt-12 rounded-[20px] border border-cl-ink/15 bg-white p-5 sm:p-7">
                <GrafikPeriode series={analitik.series} rentang="30 hari terakhir" />
              </div>
            )}
          </section>

          <div className="grid items-start gap-20 lg:grid-cols-2">
            <section aria-labelledby="judul-rekomendasi">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Eyebrow>Rekomendasi kampanye</Eyebrow>
                <a href="/pasar" className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase underline underline-offset-4">
                  Lihat semua
                </a>
              </div>
              <h2 id="judul-rekomendasi" className="sr-only">
                Rekomendasi kampanye
              </h2>
              {terbuka === null ? (
                <div className="mt-8">
                  <Kosong gagal>Daftar kampanye belum bisa dimuat karena API backend tidak tersambung.</Kosong>
                </div>
              ) : rekomendasi.length === 0 ? (
                <div className="mt-8">
                  <Kosong>Belum ada kampanye terbuka yang belum kamu lamar.</Kosong>
                </div>
              ) : (
                <ol className="mt-8 divide-y divide-cl-ink/20 border-y border-cl-ink/20">
                  {rekomendasi.map((k, i) => (
                    <li key={k.id}>
                      <a href={`/kampanye/${k.id}`} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 py-7 transition-colors hover:text-cl-rust">
                        <span className="font-mono text-xs text-cl-rust">0{i + 1}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-xl font-medium">{k.title}</span>
                          <span className="mt-2 block text-[clamp(26px,2.6vw,34px)] font-light leading-none tracking-[-0.02em] tabular-nums">
                            {rupiah(k.budget_remaining)}
                          </span>
                          <span className="mt-1 block text-sm text-stone-700">
                            sisa budget · maks {rupiah(k.cap_per_clip)} per klip
                            {k.deadline_at ? ` · berakhir ${tanggal(k.deadline_at)}` : ""}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section aria-labelledby="judul-papan" className="rounded-[24px] bg-cl-slate p-7 text-cl-ink shadow-[0_-20px_60px_rgba(0,0,0,0.35)] sm:p-10">
              <Eyebrow>Papan peringkat clipper</Eyebrow>
              <h2 id="judul-papan" className="mt-5 text-[clamp(30px,3.4vw,48px)] font-light leading-[1.02] tracking-[-0.035em] text-balance">
                Siapa jagoannya?
              </h2>
              <p className="mt-4 text-[15px] text-[#4a3600]">Per 1.000 view = 1 poin.</p>
              {papan === null ? (
                <p className="mt-8 text-[15px] text-[#4a3600]">Papan peringkat belum bisa dimuat.</p>
              ) : papan.papan.length === 0 ? (
                <p className="mt-8 text-[15px] text-[#4a3600]">Belum ada klip disetujui. Papan terisi setelah klip pertama disetujui kreator.</p>
              ) : (
                <ol className="mt-8 border-t border-cl-ink/20">
                  {papan.papan.map((p) => (
                    <li
                      key={p.rank}
                      className={`grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-cl-ink/20 py-5 ${
                        p.saya ? "-mx-4 rounded-[14px] border-transparent bg-cl-ink px-4 text-cl-paper" : ""
                      }`}
                    >
                      <span className="font-mono text-xs">{String(p.rank).padStart(2, "0")}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[clamp(20px,2vw,28px)] font-light leading-tight tracking-[-0.02em]">
                          {p.nama}
                          {p.saya ? " (kamu)" : ""}
                        </span>
                        <span className={`text-xs ${p.saya ? "text-cl-muted" : "text-[#4a3600]"}`}>{angka(p.clips)} klip disetujui</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[clamp(26px,2.8vw,40px)] font-light leading-none tracking-[-0.03em] tabular-nums">{angka(p.poin)}</span>
                        <span className={`font-mono text-[10.5px] uppercase ${p.saya ? "text-cl-muted" : "text-[#4a3600]"}`}>poin</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              {papan?.saya && papan.saya.rank > papan.papan.length && (
                <p className="mt-6 text-[15px] text-[#4a3600]">
                  Posisimu #{papan.saya.rank} dari {angka(papan.jumlah)} clipper, dengan {angka(papan.saya.poin)} poin.
                </p>
              )}
              {akunTersambung === 0 && (
                <p className="mt-6 text-[15px] text-[#4a3600]">
                  Belum ada akun sosial tersambung. Views dibaca resmi setelah kamu menyambungkan akunmu.{" "}
                  <a href="/akun" className="font-medium text-cl-ink underline underline-offset-4">
                    Buka akun sosial
                  </a>
                </p>
              )}
            </section>
          </div>

          <section aria-labelledby="judul-lamaran">
            <Eyebrow>Semua project</Eyebrow>
            {lamaran.length === 0 ? (
              <div className="mt-8">
                <Kosong>
                  Belum ada project. Buka{" "}
                  <a href="/pasar" className="font-medium underline underline-offset-4">
                    daftar kampanye
                  </a>{" "}
                  dan lamar yang cocok. Maksimal 3 proyek aktif sekaligus.
                </Kosong>
              </div>
            ) : (
              <>
              <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lamaran.map((l, i) => {
                  const sisa = l.status === "accepted" ? sisaWaktu(l.due_at) : null;
                  const idKlip = new Set(klip.filter((x) => x.application_id === l.id).map((x) => x.id));
                  const vids = (analitik?.videos ?? []).filter((v) => idKlip.has(v.submission_id));
                  return (
                    <li key={l.id}>
                      <article className="flex h-full min-h-[200px] flex-col gap-5 rounded-[18px] bg-cl-slate p-6">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-mono text-xs text-cl-rust">{String(i + 1).padStart(2, "0")}</span>
                          <Chip nada={l.status === "accepted" ? "aktif" : l.status === "applied" ? "netral" : "bahaya"}>
                            Lamaran: {LABEL_LAMARAN[l.status] ?? l.status}
                          </Chip>
                        </div>
                        <a
                          href={l.campaign ? `/kampanye/${l.campaign.id}` : "/pasar"}
                          className="text-xl font-medium leading-snug underline-offset-4 hover:underline"
                        >
                          {l.campaign?.title ?? "Kampanye tidak tersedia"}
                        </a>
                        {sisa && <p className={`text-sm font-medium ${sisa.lewat ? "text-red-900" : "text-[#4a3600]"}`}>{sisa.teks}</p>}
                        {vids.length === 0 ? (
                          <p className="text-sm text-[#4a3600]">Belum ada klip yang terbaca dari platform.</p>
                        ) : (
                          <ul className="space-y-4">
                            {vids.map((v) => (
                              <li key={`${v.submission_id}-${v.platform}`} className="rounded-[12px] bg-cl-paper p-4">
                                <p className="font-mono text-[11px] uppercase text-cl-rust">
                                  {NAMA_PLATFORM[v.platform] ?? v.platform} · {v.diunggah ? `diunggah ${tanggal(v.diunggah)}` : "tanggal belum terbaca"}
                                </p>
                                <p className="mt-2 font-medium leading-snug">{v.judul || "Judul belum terbaca"}</p>
                                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                                  <Metrik k="Views" v={v.views} />
                                  <Metrik k="Like" v={v.likes} />
                                  <Metrik k="Komentar" v={v.comments} />
                                  <div>
                                    <dt className="text-[11px] text-[#4a3600]">Share</dt>
                                    <dd className="mt-1 text-lg font-light">–</dd>
                                  </div>
                                </dl>
                                <a href={v.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-[44px] items-center text-sm underline underline-offset-4">
                                  Buka postingan
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-6 text-sm text-[#4a3600]">Share tidak tersedia dari API YouTube, jadi kolomnya kosong.</p>
              </>
            )}
          </section>
        </Isi>
      </Lembar>
    </>
  );
}

const PLATFORM_URUT = ["youtube", "tiktok", "instagram"];

async function DasborKreator({ id, nama }: { id: string; nama: string }) {
  const supabase = supabaseServer();
  const [{ data: kampanye, error }, { data: jobs }, kredit] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,title,status,budget_total,budget_remaining,rate_per_1000_views")
      .eq("creator_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("ai_jobs")
      .select("id,status,source_r2_key,created_at")
      .eq("owner_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    apiGet("/credits")
  ]);
  const daftar = (kampanye ?? []) as Kampanye[];
  const idKampanye = daftar.map((k) => k.id);

  const { data: pelamarData } = idKampanye.length
    ? await supabase.from("applications").select("id,campaign_id,status").in("campaign_id", idKampanye)
    : { data: [] as { id: string; campaign_id: string; status: string }[] };
  const pelamar = pelamarData ?? [];
  const idPelamar = pelamar.map((p) => p.id);
  const { data: klipData } = idPelamar.length
    ? await supabase.from("submissions").select("application_id,status").in("application_id", idPelamar)
    : { data: [] as { application_id: string; status: string }[] };
  const klip = klipData ?? [];

  const kampanyeDariLamaran = new Map(pelamar.map((p) => [p.id, p.campaign_id]));
  const hitung = (idK: string) => ({
    pelamar: pelamar.filter((p) => p.campaign_id === idK && p.status === "applied").length,
    review: klip.filter(
      (k) => k.status === "submitted" && kampanyeDariLamaran.get(k.application_id) === idK
    ).length
  });

  const tindakan = daftar
    .map((k) => ({ k, ...hitung(k.id) }))
    .filter((t) => t.pelamar > 0 || t.review > 0 || t.k.status === "draft");
  const terbuka = daftar.filter((k) => k.status === "open");
  const sisaBudget = terbuka.reduce((n, k) => n + k.budget_remaining, 0);
  const tayang = klip.filter((k) => SUDAH_TAYANG.includes(k.status)).length;
  const totalReview = tindakan.reduce((n, t) => n + t.review, 0);

  return (
    <>
      <Hero
        penanda="Kreator"
        judul={
          <>
            Halo, <span className="text-cl-accent">{nama}</span>
          </>
        }
        deskripsi="Putuskan pelamar, setujui klip yang masuk, lalu pantau budget yang tersisa."
        aksi={
          <>
            <a href="/kampanye/baru" className={tombolPrimer}>
              Buka kampanye baru
            </a>
            <a href="/unggah" className={tombolGelap}>
              Unggah video
            </a>
          </>
        }
      />
      <Lembar>
        <Isi className="space-y-28">
          {error && (
            <Kosong gagal>
              Kampanyemu belum bisa dimuat ({error.message}). Muat ulang halaman ini sebentar lagi.
            </Kosong>
          )}

          <section aria-labelledby="judul-tindakan">
            <Eyebrow>Perlu tindakan</Eyebrow>
            <h2 id="judul-tindakan" className="judul-besar mt-6">
              {totalReview > 0 ? `${angka(totalReview)} klip menunggu review.` : "Semua beres."}
            </h2>
            {tindakan.length === 0 ? (
              <div className="mt-8">
                <Kosong>
                  {daftar.length === 0
                    ? "Belum ada kampanye. Buka yang pertama untuk mulai menerima klip dari clipper."
                    : "Pelamar baru dan klip yang masuk akan muncul di sini."}
                </Kosong>
              </div>
            ) : (
              <ul className="-mx-4 mt-10 flex snap-x gap-5 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
                {tindakan.map(({ k, pelamar: p, review }) => (
                  <li key={k.id} className="snap-start">
                    <Bingkai href={`/kampanye/${k.id}`}>
                      <p className="font-mono text-xs uppercase text-cl-accent">{LABEL_KAMPANYE[k.status] ?? k.status}</p>
                      <p className="mt-4 text-lg font-medium leading-snug">{k.title}</p>
                      <p className="mt-auto pt-10 text-[clamp(40px,4.4vw,60px)] font-light leading-[1] tracking-[-0.03em] text-cl-accent">
                        {review > 0 ? angka(review) : angka(p)}
                      </p>
                      <p className="mt-4 text-sm text-cl-muted">
                        {[
                          k.status === "draft" ? "Menunggu pendanaan" : "",
                          p > 0 ? `${p} pelamar menunggu` : "",
                          review > 0 ? `${review} klip menunggu review` : ""
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <span className="mt-8 inline-flex min-h-[44px] items-center font-mono text-xs uppercase underline underline-offset-4">
                        {k.status === "draft" ? "Danai" : "Tinjau"}
                      </span>
                    </Bingkai>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid items-start gap-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <section aria-labelledby="judul-kampanye">
              <Eyebrow>Kampanye saya</Eyebrow>
              {daftar.length === 0 ? (
                <div className="mt-8">
                  <Kosong>
                    Belum ada kampanye. Budget minimal Rp3.000.000, dan clipper dibayar per 1.000 views.{" "}
                    <a href="/kampanye/baru" className="font-medium underline underline-offset-4">
                      Buka kampanye pertama
                    </a>
                  </Kosong>
                </div>
              ) : (
                <ul className="mt-8 divide-y divide-cl-ink/20 border-y border-cl-ink/20">
                  {daftar.map((k) => {
                    const terpakai = k.budget_total > 0 ? Math.round(((k.budget_total - k.budget_remaining) / k.budget_total) * 100) : 0;
                    return (
                      <li key={k.id} className="py-7">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <a href={`/kampanye/${k.id}`} className="text-xl font-medium underline-offset-4 hover:underline">
                              {k.title}
                            </a>
                            <p className="mt-1 text-sm text-stone-700">{rupiah(k.rate_per_1000_views)} per 1.000 views</p>
                          </div>
                          <Chip nada={k.status === "open" ? "aktif" : "netral"}>{LABEL_KAMPANYE[k.status] ?? k.status}</Chip>
                        </div>
                        <p className="mt-4 text-sm tabular-nums">
                          {rupiah(k.budget_total - k.budget_remaining)} terpakai dari {rupiah(k.budget_total)}
                        </p>
                        <div
                          role="meter"
                          aria-label={`Budget terpakai ${k.title}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={terpakai}
                          className="mt-2 h-2 overflow-hidden rounded-full bg-cl-ink/15"
                        >
                          <div className="h-full bg-cl-rust" style={{ width: `${terpakai}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section aria-labelledby="judul-ringkas" className="space-y-8">
              <Eyebrow>Posisimu sekarang</Eyebrow>
              <p id="judul-ringkas" className="text-[clamp(26px,2.8vw,38px)] font-light leading-[1.15] tracking-[-0.02em]">
                {angka(terbuka.length)} kampanye terbuka dengan sisa budget {rupiah(sisaBudget)}.
              </p>
              <p className="text-lg text-stone-700">
                {angka(pelamar.length)} pelamar tercatat sejauh ini, dan {angka(tayang)} klip sudah disetujui.
              </p>
              <div className="rounded-[20px] bg-cl-night p-6 text-cl-paper">
                <p className="text-sm text-cl-muted">Saldo kredit AI</p>
                <p className="mt-2 text-[clamp(36px,4vw,56px)] font-light leading-none tracking-[-0.03em] text-cl-accent tabular-nums">
                  {kredit ? `${angka(kredit.balance as number)}` : "–"}
                </p>
                <p className="mt-2 text-sm text-cl-muted">{kredit ? "kredit" : "Belum terbaca"}</p>
                <a href="/kredit" className={`${tombolSekunder} mt-5`}>
                  Beli kredit
                </a>
              </div>
            </section>
          </div>

          <section aria-labelledby="judul-unggahan">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Eyebrow>Antrean klip otomatis</Eyebrow>
              <a href="/unggah" className={tombolSekunder}>
                Unggah video
              </a>
            </div>
            {jobs && jobs.length > 0 ? (
              <ul className="mt-8 divide-y divide-cl-ink/20 border-y border-cl-ink/20">
                {jobs.map((j) => (
                  <li key={j.id} className="py-5">
                    <JobStatus id={j.id} status={j.status} r2key={j.source_r2_key} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8">
                <Kosong>Belum ada unggahan. Setelah kamu mengunggah video panjang, statusnya muncul di sini.</Kosong>
              </div>
            )}
          </section>
        </Isi>
      </Lembar>
    </>
  );
}

/** Kepala gelap besar, bahasa visual yang sama dengan landing. */
function Hero({
  penanda,
  judul,
  deskripsi,
  aksi
}: {
  penanda: string;
  judul: ReactNode;
  deskripsi: string;
  aksi: ReactNode;
}) {
  return (
    <section className="gelap relative overflow-hidden bg-cl-night pb-[150px] pt-[120px] text-white max-[980px]:pt-[100px]">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <p className="font-mono text-xs uppercase text-cl-accent">{penanda}</p>
        <h1 className="mt-5 text-[clamp(46px,7.6vw,112px)] font-light leading-[0.98] tracking-[-0.04em] text-balance">{judul}</h1>
        <p className="mt-6 max-w-[38ch] text-lg text-cl-muted">{deskripsi}</p>
        <div className="mt-9 flex flex-wrap gap-3">{aksi}</div>
      </div>
    </section>
  );
}

/** Panel krem yang naik menutupi kepala gelap, seperti section landing. */
function Lembar({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-[3] -mt-[80px] rounded-[24px] bg-cl-paper py-[90px] text-cl-ink shadow-[0_-20px_60px_rgba(0,0,0,0.35)] max-[560px]:py-[60px]">
      {children}
    </div>
  );
}

function Metrik({ k, v }: { k: string; v: number }) {
  return (
    <div>
      <dt className="text-[11px] text-[#4a3600]">{k}</dt>
      <dd className="mt-1 text-lg font-light tabular-nums">{angka(v)}</dd>
    </div>
  );
}

function Eyebrow({ children, tone = "terang" }: { children: ReactNode; tone?: "terang" | "gelap" }) {
  const warna = tone === "gelap" ? "text-cl-accent" : "text-cl-rust";
  const garis = tone === "gelap" ? "bg-cl-accent/60" : "bg-cl-rust/60";
  return (
    <p className={`flex items-center gap-3 font-mono text-xs uppercase ${warna}`}>
      <span className={`h-px w-10 ${garis}`} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Bingkai frame film gelap dengan lubang perforasi kuning di kedua sisi.
 * Dipakai untuk item yang butuh tindakan, supaya terlihat seperti potongan roll film dari landing.
 */
function Bingkai({ href, children }: { href: string; children: ReactNode }) {
  const lubang =
    "absolute inset-y-0 w-3.5 bg-[radial-gradient(circle,#fcc501_2.2px,transparent_2.7px)] [background-size:14px_22px] [background-position:center]";
  return (
    <a
      href={href}
      className="gelap relative flex h-full min-h-[340px] w-[280px] flex-col rounded-[14px] bg-cl-night px-8 py-7 text-cl-paper transition-transform hover:-translate-y-1 sm:w-[340px]"
    >
      <span aria-hidden="true" className={`${lubang} left-0`} />
      <span aria-hidden="true" className={`${lubang} right-0`} />
      {children}
    </a>
  );
}
