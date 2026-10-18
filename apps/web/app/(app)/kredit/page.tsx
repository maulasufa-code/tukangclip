import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/sesi";
import { apiGet } from "@/lib/api";
import { BeliKredit } from "@/components/beli-kredit";
import { Isi, Judul2, KepalaHalaman, Kosong, kartu } from "@/components/ui";

export const dynamic = "force-dynamic";

const NAMA_ALASAN: Record<string, string> = {
  "topup-xendit": "Top-up kredit",
  "pakai-job-ai": "Dipakai untuk satu video"
};

export default async function KreditPage() {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/kredit");
  if (pengguna.peran === "editor") redirect("/dasbor");

  const data = await apiGet("/credits");
  const saldo: number | null = data ? (data.balance as number) : null;
  const riwayat: { amount: number; reason: string; created_at: string }[] = data?.history ?? [];

  return (
    <>
      <KepalaHalaman
        id="judul-kredit"
        penanda="Jalur otomatis"
        judul="Kredit AI"
        deskripsi="1 kredit untuk 1 video. Beli via Xendit, komisi platform dipotong transparan sebelum dikonversi jadi kredit."
      />
      <Isi className="space-y-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <section aria-labelledby="judul-saldo" className="rounded-lg bg-cl-slate p-5 sm:p-7">
            <h2 id="judul-saldo" className="font-mono text-xs uppercase text-cl-rust">
              Saldo
            </h2>
            <p className="mt-3 text-5xl font-light tabular-nums" role="status">
              {saldo === null ? "Belum terbaca" : saldo}
            </p>
            <p className="mt-1 text-cl-ink">{saldo === null ? "API backend belum tersambung." : "kredit"}</p>
          </section>
          <section aria-labelledby="judul-topup" className={`${kartu} p-5 sm:p-7`}>
            <Judul2 id="judul-topup">Top-up</Judul2>
            <BeliKredit />
          </section>
        </div>

        <section aria-labelledby="judul-riwayat">
          <Judul2 id="judul-riwayat">Riwayat</Judul2>
          {riwayat.length === 0 ? (
            <div className="mt-4">
              <Kosong>
                Belum ada mutasi. Mutasi muncul setelah top-up berhasil atau kredit dipakai untuk satu video.
              </Kosong>
            </div>
          ) : (
            <ul className={`${kartu} mt-4 divide-y divide-stone-200`}>
              {riwayat.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-4 p-4">
                  <span>
                    {NAMA_ALASAN[r.reason] ?? r.reason}
                    <span className="block text-sm text-stone-700">
                      {new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </span>
                  <span className={`text-lg tabular-nums ${r.amount < 0 ? "text-red-900" : ""}`}>
                    {r.amount > 0 ? "+" : ""}
                    {r.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Isi>
    </>
  );
}
