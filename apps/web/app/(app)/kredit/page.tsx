import Link from "next/link";
import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/sesi";
import { apiGet } from "@/lib/api";
import { rupiah } from "@/lib/harga";
import { BeliKredit } from "@/components/beli-kredit";
import { Chip, Isi, Judul2, KepalaHalaman, Kosong, angka, kartu, tanggal, tombolSekunder } from "@/components/ui";

export const dynamic = "force-dynamic";

const NAMA_ALASAN: Record<string, string> = {
  "topup-midtrans": "Top-up kredit",
  "topup-xendit": "Top-up kredit",
  "pakai-job-ai": "Dipakai untuk satu video"
};

type Faktur = {
  id: string;
  number: string;
  kind: "topup" | "fund";
  amount: number;
  fee: number;
  credits: number;
  issued_at: string;
};

export default async function KreditPage() {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/kredit");
  if (pengguna.peran === "editor") redirect("/dasbor");

  const [data, dataFaktur] = await Promise.all([apiGet("/credits"), apiGet("/invoices")]);
  const saldo: number | null = data ? (data.balance as number) : null;
  const riwayat: { amount: number; reason: string; created_at: string }[] = data?.history ?? [];
  const faktur: Faktur[] | null = dataFaktur ? (dataFaktur.invoices as Faktur[]) : null;

  return (
    <>
      <KepalaHalaman
        id="judul-kredit"
        penanda="Jalur otomatis"
        judul="Kredit AI"
        deskripsi="1 kredit untuk 1 video. Pembayaran lewat Midtrans. Biaya platform dipotong sebelum dikonversi jadi kredit, dan setiap pembayaran lunas punya faktur."
      />
      <Isi className="space-y-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <section aria-labelledby="judul-saldo" className="rounded-lg bg-cl-slate p-5 sm:p-7">
            <h2 id="judul-saldo" className="font-mono text-xs uppercase text-cl-rust">
              Saldo
            </h2>
            <p className="mt-3 text-5xl font-light tabular-nums" role="status">
              {saldo === null ? "Belum terbaca" : angka(saldo)}
            </p>
            <p className="mt-1 text-cl-ink">
              {saldo === null ? "Saldo belum bisa dimuat. Muat ulang halaman ini." : "kredit"}
            </p>
          </section>
          <section aria-labelledby="judul-topup" className={`${kartu} p-5 sm:p-7`}>
            <Judul2 id="judul-topup">Top-up</Judul2>
            <BeliKredit />
          </section>
        </div>

        <section aria-labelledby="judul-faktur">
          <Judul2 id="judul-faktur">Faktur</Judul2>
          {faktur === null ? (
            <div className="mt-4">
              <Kosong gagal>Faktur belum bisa dimuat. Muat ulang halaman ini.</Kosong>
            </div>
          ) : faktur.length === 0 ? (
            <div className="mt-4">
              <Kosong>Belum ada faktur. Faktur dibuat otomatis setelah pembayaranmu lunas.</Kosong>
            </div>
          ) : (
            <ul className={`${kartu} mt-4 divide-y divide-stone-200`}>
              {faktur.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{f.kind === "fund" ? "Danai budget kampanye" : "Top-up kredit"}</p>
                    <p className="text-sm text-stone-700">
                      {f.number} · {tanggal(f.issued_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg tabular-nums">{rupiah(f.amount)}</span>
                    <Link href={`/kredit/faktur/${f.id}`} className={tombolSekunder}>
                      Lihat faktur
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

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
                    <span className="block text-sm text-stone-700">{tanggal(r.created_at)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {r.reason.startsWith("topup") && <Chip nada="aktif">Lunas</Chip>}
                    <span className={`text-lg tabular-nums ${r.amount < 0 ? "text-red-900" : ""}`}>
                      {r.amount > 0 ? "+" : ""}
                      {r.amount}
                    </span>
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
