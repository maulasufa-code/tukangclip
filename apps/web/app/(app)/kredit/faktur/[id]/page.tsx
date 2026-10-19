import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/sesi";
import { apiGet } from "@/lib/api";
import { rupiah } from "@/lib/harga";
import { CetakFaktur } from "@/components/cetak-faktur";
import { Chip, tanggal, tombolSekunder } from "@/components/ui";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

type Faktur = {
  id: string;
  number: string;
  kind: "topup" | "fund";
  amount: number;
  fee: number;
  credits: number;
  currency: string;
  issued_at: string;
};

export default async function FakturPage({ params }: { params: { id: string } }) {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect(`/masuk?next=/kredit/faktur/${params.id}`);

  const faktur = (await apiGet(`/invoices/${params.id}`)) as Faktur | null;
  if (!faktur) notFound();

  const bersih = faktur.amount - faktur.fee;
  const judul = faktur.kind === "fund" ? "Danai budget kampanye" : "Top-up kredit AI";

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/kredit" className={tombolSekunder}>
          Kembali ke kredit
        </Link>
        <CetakFaktur />
      </div>

      <article
        aria-labelledby="judul-faktur"
        className="rounded-lg border border-stone-200 bg-white p-6 sm:p-10 print:border-0 print:p-0"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <Logo className="h-7 w-auto text-cl-ink" />
            <p className="mt-3 text-sm text-stone-700">TukangClip</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase text-stone-700">Faktur</p>
            <h1 id="judul-faktur" className="mt-1 font-display text-2xl font-light tabular-nums">
              {faktur.number}
            </h1>
            <p className="mt-2">
              <Chip nada="aktif">Lunas</Chip>
            </p>
          </div>
        </header>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono text-xs uppercase text-stone-700">Tanggal terbit</dt>
            <dd className="mt-1">{tanggal(faktur.issued_at)}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase text-stone-700">Ditagihkan ke</dt>
            <dd className="mt-1 break-all">{pengguna.email}</dd>
          </div>
        </dl>

        <table className="mt-8 w-full border-collapse text-sm">
          <caption className="sr-only">Rincian pembayaran</caption>
          <thead>
            <tr className="border-b border-stone-300 text-left">
              <th scope="col" className="py-2 font-mono text-xs uppercase font-normal">
                Deskripsi
              </th>
              <th scope="col" className="py-2 text-right font-mono text-xs uppercase font-normal">
                Jumlah
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-stone-200">
              <td className="py-3">
                {judul}
                {faktur.kind === "topup" && (
                  <span className="block text-stone-700">{faktur.credits} kredit</span>
                )}
              </td>
              <td className="py-3 text-right tabular-nums">{rupiah(bersih)}</td>
            </tr>
            <tr className="border-b border-stone-200">
              <td className="py-3">Biaya platform</td>
              <td className="py-3 text-right tabular-nums">{rupiah(faktur.fee)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="pt-4 text-left font-display text-lg font-light">
                Total dibayar
              </th>
              <td className="pt-4 text-right font-display text-lg tabular-nums">{rupiah(faktur.amount)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-8 text-sm text-stone-700">
          Pembayaran diproses oleh Midtrans. Faktur ini dibuat otomatis oleh TukangClip setelah pembayaran
          terkonfirmasi.
        </p>
      </article>
    </div>
  );
}
