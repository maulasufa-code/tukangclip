import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { BeliKredit } from "@/components/beli-kredit";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export default async function KreditPage() {
  const supabase = supabaseServer();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) redirect("/masuk?next=/kredit");

  let saldo: number | null = null;
  let riwayat: { amount: number; reason: string; created_at: string }[] = [];
  if (API) {
    const res = await fetch(`${API}/credits`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: "no-store"
    });
    if (res.ok) {
      const out = await res.json();
      saldo = out.balance;
      riwayat = out.history;
    }
  }

  return (
    <section aria-labelledby="judul-kredit">
      <h1 id="judul-kredit" className="text-2xl font-bold">
        Kredit AI
      </h1>
      <p className="mt-2 text-sm text-stone-700">
        1 kredit untuk 1 video. Beli via Xendit, komisi platform dipotong
        transparan sebelum dikonversi jadi kredit.
      </p>
      <div className="mt-4 rounded-md border border-stone-200 p-4">
        <p className="text-sm text-stone-600">Saldo</p>
        <p className="text-3xl font-bold" role="status">
          {saldo === null ? "Belum tersambung" : `${saldo} kredit`}
        </p>
        {!API && (
          <p className="mt-1 text-sm text-stone-600">
            Isi NEXT_PUBLIC_API_URL untuk melihat saldo asli.
          </p>
        )}
      </div>
      <h2 className="mt-6 font-semibold">Top-up</h2>
      <BeliKredit />
      <h2 className="mt-6 font-semibold">Riwayat</h2>
      {riwayat.length === 0 ? (
        <p className="mt-2 text-sm text-stone-600">
          Belum ada mutasi. Mutasi muncul setelah top-up berhasil atau job dipakai.
        </p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm">
          {riwayat.map((r, i) => (
            <li key={i} className="flex justify-between rounded-md border border-stone-200 p-2">
              <span>{r.reason}</span>
              <span className={r.amount < 0 ? "text-red-800" : ""}>
                {r.amount > 0 ? "+" : ""}
                {r.amount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
