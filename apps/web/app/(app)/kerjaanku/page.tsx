import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ambilPengguna } from "@/lib/sesi";
import { rupiah } from "@/lib/harga";
import { Chip, Isi, KepalaHalaman, Kosong, kartu, sisaWaktu, tanggal, tombolPrimer } from "@/components/ui";

export const dynamic = "force-dynamic";

type Lamaran = {
  id: string;
  status: string;
  due_at: string | null;
  campaign: { id: string; title: string; rate_per_1000_views: number } | null;
};

type Klip = { application_id: string; status: string; posted_links: { platform: string; url: string }[] | null };

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

export default async function KerjaankuPage() {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/kerjaanku");

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("applications")
    .select("id,status,due_at,campaign:campaigns(id,title,rate_per_1000_views)")
    .eq("editor_id", pengguna.id)
    .order("created_at", { ascending: false });
  const lamaran = (data ?? []) as unknown as Lamaran[];
  const { data: klipData } = lamaran.length
    ? await supabase
        .from("submissions")
        .select("application_id,status,posted_links")
        .in("application_id", lamaran.map((l) => l.id))
    : { data: [] as Klip[] };
  const klip = (klipData ?? []) as Klip[];

  return (
    <>
      <KepalaHalaman
        id="judul-kerja"
        penanda="Clipper"
        judul="Kerjaanku"
        deskripsi="Proyek yang kamu lamar. Setelah diterima, kamu punya 72 jam untuk mengunggah klip hasilnya."
        aksi={
          <a href="/pasar" className={tombolPrimer}>
            Cari kampanye
          </a>
        }
      />
      <Isi>
        {error ? (
          <Kosong gagal>Lamaranmu belum bisa dimuat ({error.message}). Muat ulang halaman ini.</Kosong>
        ) : lamaran.length === 0 ? (
          <Kosong>
            Belum ada lamaran. Buka{" "}
            <a href="/pasar" className="font-medium underline underline-offset-4">
              daftar kampanye
            </a>{" "}
            dan lamar yang rate-nya sesuai.
          </Kosong>
        ) : (
          <ul className="space-y-4">
            {lamaran.map((l) => {
              const miliknya = klip.filter((k) => k.application_id === l.id);
              const sisa = l.status === "accepted" && !miliknya.length ? sisaWaktu(l.due_at) : null;
              return (
                <li key={l.id} className={`${kartu} p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a
                        href={l.campaign ? `/kampanye/${l.campaign.id}` : "/pasar"}
                        className="text-lg font-medium underline-offset-4 hover:underline"
                      >
                        {l.campaign?.title ?? "Kampanye tidak tersedia"}
                      </a>
                      {l.campaign && (
                        <p className="mt-1 text-sm text-stone-700">
                          {rupiah(l.campaign.rate_per_1000_views)} per 1.000 views
                        </p>
                      )}
                    </div>
                    <Chip nada={l.status === "accepted" ? "aktif" : l.status === "applied" ? "netral" : "bahaya"}>
                      {LABEL_LAMARAN[l.status] ?? l.status}
                    </Chip>
                  </div>

                  {sisa && (
                    <p className={`mt-3 text-sm font-medium ${sisa.lewat ? "text-red-900" : "text-cl-rust"}`}>
                      {sisa.teks} · tenggat {tanggal(l.due_at)}
                    </p>
                  )}

                  {miliknya.map((k, i) => (
                    <p key={i} className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <Chip nada={k.status === "rejected" ? "bahaya" : "aktif"}>
                        {LABEL_KLIP[k.status] ?? k.status}
                      </Chip>
                      {(k.posted_links ?? []).map((t) => (
                        <a key={t.url} href={t.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                          {NAMA_PLATFORM[t.platform] ?? t.platform}
                        </a>
                      ))}
                    </p>
                  ))}

                  {l.status === "accepted" && l.campaign && (
                    <a href={`/kampanye/${l.campaign.id}`} className="mt-4 inline-flex min-h-[44px] items-center font-medium underline underline-offset-4">
                      Kirim klip di kampanye ini
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Isi>
    </>
  );
}
