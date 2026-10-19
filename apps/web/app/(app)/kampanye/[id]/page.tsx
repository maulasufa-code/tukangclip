import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { apiGet } from "@/lib/api";
import { rupiah } from "@/lib/harga";
import { DanaiButton, HapusKlip, LamarButton, PutusanButtons, ReviewButtons, SengketaBox } from "@/components/pasar-actions";
import { KirimHasil } from "@/components/kirim-hasil";
import { Chip, Isi, Judul2, KepalaHalaman, Kosong, angka, kartu, sisaWaktu, tanggal } from "@/components/ui";

export const dynamic = "force-dynamic";

interface App {
  id: string;
  editor_id: string;
  editor_name?: string;
  status: string;
  due_at: string | null;
}

interface Sub {
  id: string;
  application_id: string;
  status: string;
  file_r2_key: string;
  posted_links?: { platform: string; url: string }[] | null;
  review_note?: string;
  flagged?: boolean;
}

type VideoSaya = {
  submission_id: string;
  platform: string;
  url: string;
  judul: string;
  diunggah: string | null;
  views: number;
  likes: number;
  comments: number;
};

const NAMA_PLATFORM: Record<string, string> = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram" };

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

export default async function KampanyePage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/kampanye/" + params.id);

  const c = await apiGet(`/campaigns/${params.id}`);
  if (!c) {
    return (
      <>
        <KepalaHalaman id="judul-kampanye" penanda="Kampanye" judul="Kampanye tidak bisa dibuka" />
        <Isi>
          <Kosong gagal>
            Kampanye ini tidak ditemukan atau API backend sedang tidak tersambung.{" "}
            <a href="/pasar" className="font-medium underline underline-offset-4">
              Kembali ke daftar kampanye
            </a>
          </Kosong>
        </Isi>
      </>
    );
  }
  if (!c.id) redirect("/pasar");

  const mine = c.creator_id === user.id;
  const apps = c.applications as App[];
  const [subs, stat, klipSaya, videoSaya] = await Promise.all([
    mine ? apiGet(`/campaigns/${params.id}/submissions`).catch(() => null) : null,
    mine ? apiGet(`/campaigns/${params.id}/analytics`).catch(() => null) : null,
    !mine && apps.length
      ? supabase.from("submissions").select("id,application_id,status,posted_links,file_r2_key,review_note").in("application_id", apps.map((a) => a.id))
      : null,
    !mine && apps.length ? apiGet("/analytics").catch(() => null) : null
  ]);
  const videoKlipku = ((videoSaya as { videos?: VideoSaya[] } | null)?.videos ?? []);
  const milikku = apps[0];
  const klipku = ((klipSaya?.data ?? []) as Sub[]);
  const namaPelamar = new Map(apps.map((a) => [a.id, a.editor_name || "Clipper"]));
  const terpakai = Math.round((((c.budget_total as number) - (c.budget_remaining as number)) / (c.budget_total as number)) * 100) || 0;
  const tenggat = milikku?.status === "accepted" ? sisaWaktu(milikku.due_at) : null;

  return (
    <>
      <KepalaHalaman
        id="judul-kampanye"
        penanda={mine ? "Kampanye saya" : "Kampanye terbuka"}
        judul={c.title}
        deskripsi={c.brief || undefined}
      />
      <Isi className="space-y-14">
        <section aria-labelledby="judul-rincian" className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-lg bg-cl-slate p-5 sm:p-7">
            <h2 id="judul-rincian" className="font-mono text-xs uppercase text-cl-rust">
              Bayaran
            </h2>
            <p className="mt-3 text-4xl font-light tabular-nums">
              {rupiah(c.rate_per_1000_views as number)}
              <span className="text-base text-cl-ink"> per 1.000 views</span>
            </p>
            <p className="mt-2 text-cl-ink">Maksimal {rupiah(c.cap_per_clip as number)} per klip.</p>
            {!mine && (
              <div className="mt-5">
                <LamarButton campaignId={params.id} mine={mine} sudah={!!milikku} />
              </div>
            )}
            {c.source_url && (
              <p className="mt-2">
                <a
                  href={c.source_url as string}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center font-medium underline underline-offset-4"
                >
                  Buka video mentah
                </a>
              </p>
            )}
          </div>
          <div className={`${kartu} p-5 sm:p-7`}>
            <h2 className="font-mono text-xs uppercase text-stone-700">Budget</h2>
            <p className="mt-3 text-2xl font-light tabular-nums">
              {rupiah((c.budget_total as number) - (c.budget_remaining as number))}
              <span className="text-sm text-stone-700"> terpakai dari {rupiah(c.budget_total as number)}</span>
            </p>
            <div
              role="meter"
              aria-label="Budget terpakai"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={terpakai}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200"
            >
              <div className="h-full bg-cl-rust" style={{ width: `${terpakai}%` }} />
            </div>
            {c.deadline_at && (
              <p className="mt-4 text-sm text-stone-700">Berakhir {tanggal(c.deadline_at as string)}</p>
            )}
          </div>
        </section>

        {!mine && (
          <section aria-labelledby="judul-statusku">
            <Judul2 id="judul-statusku">Status lamaranmu</Judul2>
            {!milikku ? (
              <div className="mt-4">
                <Kosong>
                  Kamu belum melamar. Setelah kreator menerima lamaranmu, kamu punya 72 jam untuk mengirim klip.
                </Kosong>
              </div>
            ) : (
              <div className={`${kartu} mt-4 p-4`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Chip nada={milikku.status === "accepted" ? "aktif" : milikku.status === "applied" ? "netral" : "bahaya"}>
                    {LABEL_LAMARAN[milikku.status] ?? milikku.status}
                  </Chip>
                  {tenggat && (
                    <p className={`text-sm font-medium ${tenggat.lewat ? "text-red-900" : "text-cl-rust"}`}>
                      {tenggat.teks} · {tanggal(milikku.due_at)}
                    </p>
                  )}
                </div>
                {klipku.flatMap((k) => (k.posted_links ?? []).map((t) => ({ k, t }))).map(({ k, t }) => {
                  const v = videoKlipku.find((x) => x.submission_id === k.id && x.platform === t.platform);
                  return (
                    <details key={`${k.id}-${t.platform}`} className="group mt-3 rounded-[14px] bg-cl-slate">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0">
                          <span className="block font-mono text-[11px] uppercase text-cl-rust">
                            {NAMA_PLATFORM[t.platform] ?? t.platform} · {v?.diunggah ? tanggal(v.diunggah) : "tanggal belum terbaca"}
                          </span>
                          <span className="block truncate font-medium">{v?.judul || "Judul belum terbaca"}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3 text-sm tabular-nums">
                          {v ? `${angka(v.views)} views` : "–"}
                          <Chip nada={k.status === "rejected" ? "bahaya" : "aktif"}>{LABEL_KLIP[k.status] ?? k.status}</Chip>
                          <span aria-hidden="true" className="text-xl font-light transition-transform group-open:rotate-45">+</span>
                        </span>
                      </summary>
                      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-5 pb-5">
                        <dl className="flex flex-wrap gap-x-8 gap-y-3">
                          <Metrik k="Views" v={v?.views ?? null} />
                          <Metrik k="Like" v={v?.likes ?? null} />
                          <Metrik k="Komentar" v={v?.comments ?? null} />
                          <Metrik k="Share" v={null} />
                        </dl>
                        <a href={t.url} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center text-sm underline underline-offset-4">
                          Buka postingan
                        </a>
                      </div>
                      {(k.status === "submitted" || k.status === "draft") && (
                        <div className="border-t border-cl-ink/10 px-5 py-5">
                          {k.status === "draft" && k.review_note && (
                            <p className="mb-3 text-sm text-[#4a3600]">Alasan dari kreator: {k.review_note}</p>
                          )}
                          <p className="font-medium">Ubah tautan</p>
                          <KirimHasil applicationId={milikku.id} submissionId={k.id} />
                          <div className="mt-4">
                            <HapusKlip subId={k.id} />
                          </div>
                        </div>
                      )}
                    </details>
                  );
                })}
                {milikku.status === "accepted" && (
                  <div className="mt-4 border-t border-stone-200 pt-4">
                    <p className="font-medium">Kirim klip</p>
                    <KirimHasil applicationId={milikku.id} />
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {mine && (
          <>
            <section aria-labelledby="judul-dana">
              <Judul2 id="judul-dana">Tambah dana</Judul2>
              <p className="mt-2 max-w-2xl text-sm text-stone-700">
                Budget yang kamu tambah masuk utuh ke escrow untuk clipper. Biaya platform dibayar di atasnya.
              </p>
              <DanaiButton campaignId={params.id} />
            </section>

            <section aria-labelledby="judul-analitik">
              <Judul2 id="judul-analitik">Hasil kampanye</Judul2>
              {!stat ? (
                <div className="mt-4">
                  <Kosong gagal>Analitik belum bisa dimuat. Muat ulang halaman ini sebentar lagi.</Kosong>
                </div>
              ) : (
                <>
                  <dl className={`${kartu} mt-4 grid divide-y divide-stone-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0`}>
                    <Sel k="Klip masuk" v={angka(stat.clips)} />
                    <Sel k="Klip disetujui" v={angka(stat.posted)} />
                    <Sel k="Total views" v={angka(stat.total_views)} />
                    <Sel k="Sudah dibayar" v={rupiah(stat.total_paid)} />
                  </dl>
                </>
              )}
            </section>

            <section aria-labelledby="judul-pelamar">
              <Judul2 id="judul-pelamar">Pelamar ({apps.length})</Judul2>
              {apps.length === 0 ? (
                <div className="mt-4">
                  <Kosong>Belum ada pelamar. Bagikan tautan kampanye ini agar clipper melihatnya.</Kosong>
                </div>
              ) : (
                <ul className={`${kartu} mt-4 divide-y divide-stone-200`}>
                  {apps.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4">
                      <div>
                        <p className="font-medium">{a.editor_name || "Clipper"}</p>
                        <p className="mt-1 text-sm text-stone-700">
                          {a.due_at ? `Tenggat ${tanggal(a.due_at)}` : "Belum diputuskan"}
                        </p>
                      </div>
                      {a.status === "applied" ? (
                        <PutusanButtons appId={a.id} />
                      ) : (
                        <Chip nada={a.status === "accepted" ? "aktif" : "bahaya"}>
                          {LABEL_LAMARAN[a.status] ?? a.status}
                        </Chip>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="judul-klip">
              <Judul2 id="judul-klip">Klip masuk</Judul2>
              {!subs || subs.items.length === 0 ? (
                <div className="mt-4">
                  <Kosong gagal={!subs}>
                    {!subs
                      ? "Daftar klip belum bisa dimuat. Muat ulang halaman ini sebentar lagi."
                      : "Belum ada klip. Klip muncul di sini setelah clipper yang kamu terima mengirim hasilnya."}
                  </Kosong>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {(subs.items as Sub[]).map((s) => (
                    <li key={s.id} className={`${kartu} p-4`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{namaPelamar.get(s.application_id) ?? "Clipper"}</p>
                        <Chip nada={s.status === "rejected" ? "bahaya" : "aktif"}>
                          {LABEL_KLIP[s.status] ?? s.status}
                        </Chip>
                      </div>
                      {s.status === "submitted" && (
                        <div className="mt-3">
                          <ReviewButtons subId={s.id} />
                        </div>
                      )}
                      {(s.posted_links ?? []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-x-4">
                          {(s.posted_links ?? []).map((t) => (
                            <a
                              key={t.url}
                              href={t.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-[44px] items-center text-sm underline underline-offset-4"
                            >
                              Lihat di {NAMA_PLATFORM[t.platform] ?? t.platform}
                            </a>
                          ))}
                        </div>
                      )}
                      <SengketaBox subId={s.id} flagged={!!s.flagged} mine={mine} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </Isi>
    </>
  );
}

function Metrik({ k, v }: { k: string; v: number | null }) {
  return (
    <div>
      <dt className="text-[11px] text-[#4a3600]">{k}</dt>
      <dd className="mt-1 text-lg font-light tabular-nums">{v === null ? "–" : angka(v)}</dd>
    </div>
  );
}

function Sel({ k, v }: { k: string; v: string }) {
  return (
    <div className="p-4">
      <dt className="text-sm text-stone-700">{k}</dt>
      <dd className="mt-1 text-2xl font-light tabular-nums">{v}</dd>
    </div>
  );
}
