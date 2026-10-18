import type { KampanyePublik } from "@/lib/kampanye";
import { rupiah } from "@/lib/harga";

// Kartu satu kampanye terbuka: rate per 1.000 views paling menonjol, karena itu yang dicari clipper.
export function KartuKampanye({ k }: { k: KampanyePublik }) {
  const sisa = k.budget_total > 0 ? Math.round((k.budget_remaining / k.budget_total) * 100) : 0;
  return (
    <article className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-4 text-cl-ink">
      <h3 className="text-[17px] font-medium leading-snug">{k.title}</h3>
      {k.brief && <p className="mt-1.5 line-clamp-2 text-sm text-stone-700">{k.brief}</p>}
      <p className="mt-4 text-2xl font-light tabular-nums">
        {rupiah(k.rate_per_1000_views)}
        <span className="text-sm text-stone-700"> per 1.000 views</span>
      </p>
      <p className="mt-1 text-sm text-stone-700">Maks {rupiah(k.cap_per_clip)} per klip</p>
      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span>Sisa budget</span>
          <span className="tabular-nums">
            {rupiah(k.budget_remaining)} dari {rupiah(k.budget_total)}
          </span>
        </div>
        <div
          role="meter"
          aria-label="Sisa budget"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sisa}
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200"
        >
          <div className="h-full bg-cl-rust" style={{ width: `${sisa}%` }} />
        </div>
      </div>
      {k.deadline_at && (
        <p className="mt-3 text-sm text-stone-700">Berakhir {new Date(k.deadline_at).toLocaleDateString("id-ID")}</p>
      )}
      <div className="mt-auto pt-4">
        <a
          href={`/kampanye/${k.id}`}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-cl-accent px-4 text-sm text-cl-accent-ink hover:bg-cl-accent-hi"
        >
          Lihat dan lamar
        </a>
      </div>
    </article>
  );
}
