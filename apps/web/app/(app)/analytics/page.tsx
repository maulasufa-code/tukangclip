import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/sesi";
import { apiGet } from "@/lib/api";
import { rupiah } from "@/lib/harga";
import { AngkaNaik, FilterAnalytics, GerakMasuk, GrafikPeriode, type Titik } from "@/components/analytics-visual";
import { Chip, Isi, Judul2, KepalaHalaman, Kosong, angka, kartu } from "@/components/ui";

export const dynamic = "force-dynamic";

const NAMA_PLATFORM: Record<string, string> = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram" };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const geser = (tanggal: string, hari: number) => {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + hari);
  return iso(d);
};
const tampilTanggal = (tanggal: string) =>
  new Date(`${tanggal}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

type Metrik = { views: number; likes: number; comments: number; estimate: number; videos: number };
type Video = Metrik & {
  submission_id: string;
  campaign_id: string;
  campaign_title: string;
  platform: string;
  url: string;
  flagged: boolean;
  terbaca: boolean;
};
type Laporan = {
  days: number;
  peran: "creator" | "editor";
  totals: Metrik & { views_gain: number };
  campaigns: (Metrik & { id: string; title: string; rate: number })[];
  platforms: (Metrik & { platform: string })[];
  videos: Video[];
  series: Titik[];
  pilihan_kampanye: { id: string; title: string }[];
};

const MAKS_VIDEO = 50;

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams: { from?: string; to?: string; kampanye?: string };
}) {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/analytics");

  const maks = iso(new Date());
  const sampai = ISO.test(searchParams.to ?? "") && searchParams.to! <= maks ? searchParams.to! : maks;
  const dariMasuk = ISO.test(searchParams.from ?? "") ? searchParams.from! : "";
  const dari = dariMasuk && dariMasuk <= sampai ? dariMasuk : geser(sampai, -29);
  const kampanye = searchParams.kampanye ?? "";
  const l = (await apiGet(
    `/analytics?from=${dari}&to=${sampai}${kampanye ? `&campaign_id=${encodeURIComponent(kampanye)}` : ""}`
  )) as Laporan | null;
  const rentang = `${tampilTanggal(dari)} sampai ${tampilTanggal(sampai)}`;
  const preset = [7, 30, 90].map((h) => ({ label: `${h} hari`, dari: geser(sampai, -(h - 1)), sampai }));

  const clipper = (l?.peran ?? (pengguna.peran === "editor" ? "editor" : "creator")) === "editor";

  return (
    <>
      <KepalaHalaman
        id="judul-analytics"
        penanda="Analytics"
        judul={clipper ? "Jangkauan klipmu" : "Jangkauan kampanyemu"}
        deskripsi="Views, like, dan komentar tiap video yang sudah disetujui. Angka dibaca dari platform sekali sehari."
        aksi={
          <FilterAnalytics
            dari={dari}
            sampai={sampai}
            maks={maks}
            kampanye={kampanye}
            pilihan={l?.pilihan_kampanye ?? []}
            preset={preset}
          />
        }
      />
      <Isi className="space-y-14">
        {!l ? (
          <Kosong gagal>
            Analytics belum bisa dimuat karena API backend tidak tersambung. Muat ulang halaman ini sebentar lagi.
          </Kosong>
        ) : l.videos.length === 0 ? (
          <Kosong>
            {clipper
              ? "Belum ada klip disetujui. Setelah kreator menyetujui tautanmu, views, like, dan komentar mulai dilacak di sini."
              : "Belum ada klip disetujui di kampanyemu. Setelah kamu menyetujui klip dari clipper, angkanya muncul di sini."}
          </Kosong>
        ) : (
          <Isian l={l} rentang={rentang} clipper={clipper} />
        )}
      </Isi>
    </>
  );
}

function Isian({ l, rentang, clipper }: { l: Laporan; rentang: string; clipper: boolean }) {
  const t = l.totals;
  const maksPlatform = Math.max(...l.platforms.map((p) => p.views), 1);
  const maksKampanye = Math.max(...l.campaigns.map((c) => c.views), 1);
  const belumTerbaca = (p: string) => !l.videos.some((v) => v.platform === p && v.terbaca);
  const adaBelumTerbaca = l.videos.some((v) => !v.terbaca);

  return (
    <>
      <section aria-labelledby="judul-ringkasan" className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <h2 id="judul-ringkasan" className="sr-only">
          Ringkasan
        </h2>
        <GerakMasuk className="rounded-lg bg-cl-slate p-5 sm:p-8">
          <p className="text-sm text-cl-ink">Total views yang sudah terjangkau</p>
          <p className="mt-2 font-display text-6xl font-light leading-none tracking-[-0.03em] sm:text-8xl">
            <AngkaNaik nilai={t.views} />
          </p>
          <p className="mt-4 text-cl-ink">
            {t.views_gain > 0
              ? `Bertambah ${angka(t.views_gain)} selama periode ini.`
              : "Belum ada tambahan selama periode ini."}
          </p>
        </GerakMasuk>

        <dl className={`${kartu} divide-y divide-stone-200 p-5 sm:p-8`}>
          <div className="pb-4">
            <dt className="text-sm text-stone-700">{clipper ? "Estimasi pendapatan" : "Estimasi insentif untuk clipper"}</dt>
            <dd className="mt-1 font-display text-4xl font-light tabular-nums">
              <AngkaNaik nilai={t.estimate} uang />
            </dd>
          </div>
          <Baris k="Like" v={t.likes} />
          <Baris k="Komentar" v={t.comments} />
          <Baris k="Video disetujui" v={t.videos} />
        </dl>
        <p className="text-sm text-stone-700 lg:col-span-2">
          Estimasi memakai rate per 1.000 views dan batas per klip tiap kampanye, dibagi ke platform menurut views.
          Pembayaran sebenarnya dihitung saat pencairan dan mengikuti sisa budget.
        </p>
      </section>

      <section aria-labelledby="judul-grafik">
        <Judul2 id="judul-grafik">Pertumbuhan jangkauan</Judul2>
        <div className={`${kartu} mt-4 p-4 sm:p-6`}>
          <GrafikPeriode series={l.series} rentang={rentang} />
        </div>
      </section>

      <section aria-labelledby="judul-platform">
        <Judul2 id="judul-platform">Per platform</Judul2>
        <GerakMasuk className={`${kartu} mt-4 divide-y divide-stone-200`}>
          {l.platforms.map((p, i) => {
            const kosong = belumTerbaca(p.platform);
            return (
              <div key={p.platform} className="grid gap-x-8 gap-y-2 p-4 md:grid-cols-[9rem_minmax(0,1fr)_auto] md:items-center">
                <div>
                  <p className="font-medium">{NAMA_PLATFORM[p.platform] ?? p.platform}</p>
                  <p className="text-sm text-stone-700">{angka(p.videos)} video</p>
                </div>
                <div className="h-3 rounded-[4px] bg-stone-200" aria-hidden="true">
                  <div
                    className="gerak gerak-batang h-full rounded-[4px] bg-cl-rust"
                    style={{ width: `${(p.views / maksPlatform) * 100}%`, animationDelay: `${i * 90}ms` }}
                  />
                </div>
                {p.videos === 0 ? (
                  <p className="text-sm text-stone-700 md:text-right">Belum ada klip di platform ini</p>
                ) : kosong ? (
                  <p className="text-sm text-stone-700 md:text-right">Belum terbaca</p>
                ) : (
                  <p className="text-sm tabular-nums md:text-right">
                    <span className="font-medium">{angka(p.views)} views</span> · {angka(p.likes)} like ·{" "}
                    {angka(p.comments)} komentar · {rupiah(p.estimate)}
                  </p>
                )}
              </div>
            );
          })}
        </GerakMasuk>
        {adaBelumTerbaca && (
          <p className="mt-3 text-sm text-stone-700">
            Tanda belum terbaca berarti platform itu belum bisa dibaca otomatis. Saat ini hanya YouTube yang
            terhubung ke pembacaan harian.
          </p>
        )}
      </section>

      <section aria-labelledby="judul-kampanye-an">
        <Judul2 id="judul-kampanye-an">Per kampanye</Judul2>
        <GerakMasuk className={`${kartu} mt-4 overflow-x-auto`}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cl-slate">
              <tr>
                <th scope="col" className="p-3 font-medium">Kampanye</th>
                <th scope="col" className="p-3 text-right font-medium">Video</th>
                <th scope="col" className="w-40 p-3 font-medium">Views</th>
                <th scope="col" className="p-3 text-right font-medium">Like</th>
                <th scope="col" className="p-3 text-right font-medium">Komentar</th>
                <th scope="col" className="p-3 text-right font-medium">Estimasi</th>
              </tr>
            </thead>
            <tbody>
              {l.campaigns.map((c, i) => (
                <tr key={c.id} className="border-t border-stone-200">
                  <th scope="row" className="p-3 font-normal">
                    <a href={`/kampanye/${c.id}`} className="font-medium underline-offset-4 hover:underline">
                      {c.title}
                    </a>
                    <span className="block text-stone-700">{rupiah(c.rate)} per 1.000 views</span>
                  </th>
                  <td className="p-3 text-right tabular-nums">{angka(c.videos)}</td>
                  <td className="p-3">
                    <span className="tabular-nums">{angka(c.views)}</span>
                    <span aria-hidden="true" className="mt-1 block h-1.5 rounded-[3px] bg-stone-200">
                      <span
                        className="gerak gerak-batang block h-full rounded-[3px] bg-cl-rust"
                        style={{ width: `${(c.views / maksKampanye) * 100}%`, animationDelay: `${i * 90}ms` }}
                      />
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">{angka(c.likes)}</td>
                  <td className="p-3 text-right tabular-nums">{angka(c.comments)}</td>
                  <td className="p-3 text-right tabular-nums">{rupiah(c.estimate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GerakMasuk>
      </section>

      <section aria-labelledby="judul-video">
        <Judul2 id="judul-video">Per video</Judul2>
        <div className={`${kartu} mt-4 overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cl-slate">
              <tr>
                <th scope="col" className="p-3 font-medium">Video</th>
                <th scope="col" className="p-3 text-right font-medium">Views</th>
                <th scope="col" className="p-3 text-right font-medium">Like</th>
                <th scope="col" className="p-3 text-right font-medium">Komentar</th>
                <th scope="col" className="p-3 text-right font-medium">Estimasi</th>
              </tr>
            </thead>
            <tbody>
              {l.videos.slice(0, MAKS_VIDEO).map((v) => (
                <tr key={`${v.submission_id}-${v.platform}`} className="border-t border-stone-200">
                  <th scope="row" className="p-3 font-normal">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline underline-offset-4"
                    >
                      {NAMA_PLATFORM[v.platform] ?? v.platform}
                    </a>
                    <span className="block text-stone-700">{v.campaign_title}</span>
                    {v.flagged && (
                      <span className="mt-1 inline-block">
                        <Chip nada="bahaya">Ditandai</Chip>
                      </span>
                    )}
                  </th>
                  {v.terbaca ? (
                    <>
                      <td className="p-3 text-right tabular-nums">{angka(v.views)}</td>
                      <td className="p-3 text-right tabular-nums">{angka(v.likes)}</td>
                      <td className="p-3 text-right tabular-nums">{angka(v.comments)}</td>
                      <td className="p-3 text-right tabular-nums">{rupiah(v.estimate)}</td>
                    </>
                  ) : (
                    <td colSpan={4} className="p-3 text-right text-stone-700">
                      Belum terbaca
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {l.videos.length > MAKS_VIDEO && (
          <p className="mt-3 text-sm text-stone-700">
            Menampilkan {MAKS_VIDEO} video dengan views terbanyak dari {angka(l.videos.length)}.
          </p>
        )}
      </section>
    </>
  );
}

function Baris({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-4 last:pb-0">
      <dt className="text-sm text-stone-700">{k}</dt>
      <dd className="text-2xl font-light">
        <AngkaNaik nilai={v} />
      </dd>
    </div>
  );
}
