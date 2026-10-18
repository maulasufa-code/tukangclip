import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ambilPengguna } from "@/lib/sesi";
import { apiGet } from "@/lib/api";
import { ambilKampanye } from "@/lib/kampanye";
import { rupiah } from "@/lib/harga";
import { JobStatus } from "@/components/job-status";
import {
  Chip,
  Isi,
  Judul2,
  KepalaHalaman,
  Kosong,
  angka,
  kartu,
  sisaWaktu,
  tanggal,
  tombolGelap,
  tombolPrimer,
  tombolSekunder
} from "@/components/ui";

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
  draft: "Draf",
  submitted: "Menunggu review",
  approved: "Disetujui",
  rejected: "Ditolak",
  posted: "Tayang",
  tracking: "Dilacak",
  paid_out: "Dibayar"
};

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

type Klip = { application_id: string; status: string; views_final: number | null };

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
  const [{ data, error }, terbuka, sosial] = await Promise.all([
    supabase
      .from("applications")
      .select("id,status,due_at,campaign:campaigns(id,title,rate_per_1000_views,budget_remaining)")
      .eq("editor_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    ambilKampanye("rate"),
    apiGet("/social")
  ]);
  const lamaran = (data ?? []) as unknown as Lamaran[];

  const idDiterima = lamaran.filter((l) => l.status === "accepted").map((l) => l.id);
  const { data: klipData } = idDiterima.length
    ? await supabase
        .from("submissions")
        .select("application_id,status,views_final")
        .in("application_id", idDiterima)
    : { data: [] as Klip[] };
  const klip = (klipData ?? []) as Klip[];

  const sudahKirim = new Set(klip.filter((k) => k.status !== "rejected").map((k) => k.application_id));
  const perluKirim = lamaran
    .filter((l) => l.status === "accepted" && !sudahKirim.has(l.id))
    .sort((a, b) => Date.parse(a.due_at ?? "") - Date.parse(b.due_at ?? ""));
  const menunggu = lamaran.filter((l) => l.status === "applied").length;
  const tayang = klip.filter((k) => SUDAH_TAYANG.includes(k.status)).length;
  const views = klip.reduce((n, k) => n + (k.views_final ?? 0), 0);
  const sudahDilamar = new Set(lamaran.map((l) => l.campaign?.id));
  const saran = (terbuka ?? []).filter((k) => !sudahDilamar.has(k.id)).slice(0, 3);
  const akunTersambung = sosial ? (sosial.items as unknown[]).length : null;

  return (
    <>
      <KepalaHalaman
        id="judul-dasbor"
        penanda="Clipper"
        judul={
          <>
            Halo, <span className="text-cl-accent">{nama}</span>
          </>
        }
        deskripsi="Kirim klip sebelum tenggat, lalu cari kampanye berikutnya yang rate-nya cocok."
        aksi={
          <>
            <a href="/pasar" className={tombolPrimer}>
              Cari kampanye
            </a>
            <a href="/kerjaanku" className={tombolGelap}>
              Kerjaanku
            </a>
          </>
        }
      />
      <Isi className="space-y-14">
        {error && (
          <Kosong gagal>
            Lamaranmu belum bisa dimuat ({error.message}). Muat ulang halaman ini sebentar lagi.
          </Kosong>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <section aria-labelledby="judul-kirim" className="rounded-lg bg-cl-slate p-5 sm:p-7">
            <Judul2 id="judul-kirim">Perlu dikirim</Judul2>
            {perluKirim.length === 0 ? (
              <p className="mt-4 text-cl-ink">
                {lamaran.length === 0
                  ? "Belum ada lamaran. Pilih satu kampanye di bawah, lalu lamar."
                  : "Tidak ada klip yang menunggu. Lamaran yang diterima akan muncul di sini beserta tenggatnya."}
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-cl-ink/15">
                {perluKirim.map((l) => {
                  const sisa = sisaWaktu(l.due_at);
                  return (
                    <li
                      key={l.id}
                      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{l.campaign?.title ?? "Kampanye tidak tersedia"}</p>
                        <p className="mt-1 text-sm text-cl-ink">
                          {sisa ? (
                            <span className={sisa.lewat ? "font-medium text-red-900" : "font-medium text-cl-rust"}>
                              {sisa.teks}
                            </span>
                          ) : (
                            "Tanpa tenggat"
                          )}
                          {l.due_at ? ` · ${tanggal(l.due_at)}` : ""}
                        </p>
                      </div>
                      <a href="/kerjaanku" className={tombolPrimer}>
                        Kirim klip
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside aria-labelledby="judul-ringkas" className={`${kartu} p-5 sm:p-7`}>
            <Judul2 id="judul-ringkas">Ringkasan</Judul2>
            <dl className="mt-4 divide-y divide-stone-200">
              <Baris k="Lamaran menunggu" v={angka(menunggu)} />
              <Baris k="Sedang dikerjakan" v={angka(perluKirim.length)} />
              <Baris k="Klip tayang" v={angka(tayang)} />
              <Baris k="Views final tercatat" v={angka(views)} />
              <Baris
                k="Akun sosial tersambung"
                v={akunTersambung === null ? "Belum terbaca" : angka(akunTersambung)}
              />
            </dl>
            {akunTersambung === 0 && (
              <p className="mt-4 text-sm text-stone-700">
                Sambungkan akunmu agar views klip terbaca resmi.{" "}
                <a href="/akun" className="font-medium underline underline-offset-4">
                  Buka akun sosial
                </a>
              </p>
            )}
          </aside>
        </div>

        <section aria-labelledby="judul-saran">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Judul2 id="judul-saran">Rate tertinggi saat ini</Judul2>
            <a href="/pasar" className="inline-flex min-h-[44px] items-center text-sm underline underline-offset-4">
              Lihat semua
            </a>
          </div>
          {terbuka === null ? (
            <div className="mt-4">
              <Kosong gagal>Daftar kampanye belum bisa dimuat karena API backend tidak tersambung.</Kosong>
            </div>
          ) : saran.length === 0 ? (
            <div className="mt-4">
              <Kosong>Belum ada kampanye terbuka yang belum kamu lamar.</Kosong>
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {saran.map((k, i) => (
                <li key={k.id}>
                  <a
                    href={`/kampanye/${k.id}`}
                    className={`flex h-full flex-col rounded-lg border p-4 transition-transform hover:-translate-y-0.5 ${
                      i === 0 ? "border-cl-ink bg-cl-ink text-cl-paper" : "border-stone-200 bg-white"
                    }`}
                  >
                    <span className="font-medium leading-snug">{k.title}</span>
                    <span className="mt-4 text-2xl font-light tabular-nums">
                      {rupiah(k.rate_per_1000_views)}
                      <span className={`text-sm ${i === 0 ? "text-cl-muted" : "text-stone-700"}`}>
                        {" "}
                        per 1.000 views
                      </span>
                    </span>
                    <span className={`mt-1 text-sm ${i === 0 ? "text-cl-muted" : "text-stone-700"}`}>
                      Sisa budget {rupiah(k.budget_remaining)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="judul-lamaran">
          <Judul2 id="judul-lamaran">Semua lamaran</Judul2>
          {lamaran.length === 0 ? (
            <div className="mt-4">
              <Kosong>
                Belum ada lamaran. Buka{" "}
                <a href="/pasar" className="font-medium underline underline-offset-4">
                  daftar kampanye
                </a>{" "}
                dan lamar yang rate-nya sesuai. Maksimal 3 proyek aktif sekaligus.
              </Kosong>
            </div>
          ) : (
            <ul className={`${kartu} mt-4 divide-y divide-stone-200`}>
              {lamaran.map((l) => {
                const k = klip.find((x) => x.application_id === l.id);
                return (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 p-4">
                    <div className="min-w-0">
                      <a
                        href={l.campaign ? `/kampanye/${l.campaign.id}` : "/pasar"}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {l.campaign?.title ?? "Kampanye tidak tersedia"}
                      </a>
                      {l.campaign && (
                        <p className="mt-1 text-sm text-stone-700">
                          {rupiah(l.campaign.rate_per_1000_views)} per 1.000 views
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {k && <Chip nada="aktif">{LABEL_KLIP[k.status] ?? k.status}</Chip>}
                      <Chip nada={l.status === "accepted" ? "aktif" : l.status === "applied" ? "netral" : "bahaya"}>
                        {LABEL_LAMARAN[l.status] ?? l.status}
                      </Chip>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </Isi>
    </>
  );
}

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

  return (
    <>
      <KepalaHalaman
        id="judul-dasbor"
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
      <Isi className="space-y-14">
        {error && (
          <Kosong gagal>
            Kampanyemu belum bisa dimuat ({error.message}). Muat ulang halaman ini sebentar lagi.
          </Kosong>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <section aria-labelledby="judul-tindakan" className="rounded-lg bg-cl-slate p-5 sm:p-7">
            <Judul2 id="judul-tindakan">Perlu tindakan</Judul2>
            {tindakan.length === 0 ? (
              <p className="mt-4 text-cl-ink">
                {daftar.length === 0
                  ? "Belum ada kampanye. Buka yang pertama untuk mulai menerima klip dari clipper."
                  : "Semua beres. Pelamar baru dan klip yang masuk akan muncul di sini."}
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-cl-ink/15">
                {tindakan.map(({ k, pelamar: p, review }) => (
                  <li
                    key={k.id}
                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{k.title}</p>
                      <p className="mt-1 text-sm text-cl-ink">
                        {[
                          k.status === "draft" ? "Menunggu pendanaan" : "",
                          p > 0 ? `${p} pelamar menunggu` : "",
                          review > 0 ? `${review} klip menunggu review` : ""
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <a href={`/kampanye/${k.id}`} className={tombolPrimer}>
                      {k.status === "draft" ? "Danai" : "Tinjau"}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside aria-labelledby="judul-ringkas" className={`${kartu} p-5 sm:p-7`}>
            <Judul2 id="judul-ringkas">Ringkasan</Judul2>
            <dl className="mt-4 divide-y divide-stone-200">
              <Baris k="Kampanye terbuka" v={angka(terbuka.length)} />
              <Baris k="Sisa budget terbuka" v={rupiah(sisaBudget)} />
              <Baris k="Pelamar total" v={angka(pelamar.length)} />
              <Baris k="Klip tayang" v={angka(tayang)} />
              <Baris
                k="Saldo kredit AI"
                v={kredit ? `${angka(kredit.balance as number)} kredit` : "Belum terbaca"}
              />
            </dl>
            <a
              href="/kredit"
              className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium underline underline-offset-4"
            >
              Beli kredit
            </a>
          </aside>
        </div>

        <section aria-labelledby="judul-kampanye">
          <Judul2 id="judul-kampanye">Kampanye saya</Judul2>
          {daftar.length === 0 ? (
            <div className="mt-4">
              <Kosong>
                Belum ada kampanye. Budget minimal Rp3.000.000, dan clipper dibayar per 1.000 views.{" "}
                <a href="/kampanye/baru" className="font-medium underline underline-offset-4">
                  Buka kampanye pertama
                </a>
              </Kosong>
            </div>
          ) : (
            <ul className={`${kartu} mt-4 divide-y divide-stone-200`}>
              {daftar.map((k) => {
                const sisa = k.budget_total > 0 ? Math.round((k.budget_remaining / k.budget_total) * 100) : 0;
                return (
                  <li key={k.id} className="grid gap-x-8 gap-y-3 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <a href={`/kampanye/${k.id}`} className="font-medium underline-offset-4 hover:underline">
                        {k.title}
                      </a>
                      <p className="mt-1 text-sm text-stone-700">
                        {rupiah(k.rate_per_1000_views)} per 1.000 views
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Sisa budget</span>
                        <span className="tabular-nums">
                          {rupiah(k.budget_remaining)} dari {rupiah(k.budget_total)}
                        </span>
                      </div>
                      <div
                        role="meter"
                        aria-label={`Sisa budget ${k.title}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={sisa}
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200"
                      >
                        <div className="h-full bg-cl-rust" style={{ width: `${sisa}%` }} />
                      </div>
                    </div>
                    <Chip nada={k.status === "open" ? "aktif" : "netral"}>
                      {LABEL_KAMPANYE[k.status] ?? k.status}
                    </Chip>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="judul-unggahan">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Judul2 id="judul-unggahan">Antrean klip otomatis</Judul2>
            <a href="/unggah" className={tombolSekunder}>
              Unggah video
            </a>
          </div>
          {jobs && jobs.length > 0 ? (
            <ul className={`${kartu} mt-4 divide-y divide-stone-200`}>
              {jobs.map((j) => (
                <li key={j.id} className="p-4">
                  <JobStatus id={j.id} status={j.status} r2key={j.source_r2_key} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <Kosong>
                Belum ada unggahan. Setelah kamu mengunggah video panjang, statusnya muncul di sini.
              </Kosong>
            </div>
          )}
        </section>
      </Isi>
    </>
  );
}

function Baris({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-stone-700">{k}</dt>
      <dd className="text-right text-lg font-light tabular-nums">{v}</dd>
    </div>
  );
}
