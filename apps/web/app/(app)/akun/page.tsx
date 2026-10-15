import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { apiGet } from "@/lib/api";
import { SambungButtons } from "@/components/sambung-buttons";

export default async function AkunPage() {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/akun");
  const data = await apiGet("/social");

  return (
    <section aria-labelledby="judul-akun">
      <h1 id="judul-akun" className="text-2xl font-bold">Akun media sosial</h1>
      <p className="mt-2 text-sm text-stone-700">
        Klip organic diposting dari akunmu agar views terbaca resmi.
      </p>
      <div className="mt-4">
        <SambungButtons />
      </div>
      <h2 className="mt-6 font-semibold">Tersambung</h2>
      {!data || data.items.length === 0 ? (
        <p className="mt-2 text-sm text-stone-600">Belum ada akun tersambung.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm">
          {data.items.map((s: { platform: string; account_name: string }) => (
            <li key={s.platform} className="rounded-md border border-stone-200 p-3">
              {s.platform} {s.account_name ? `· ${s.account_name}` : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
