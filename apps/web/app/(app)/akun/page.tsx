import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/sesi";
import { apiGet } from "@/lib/api";
import { SambungButtons } from "@/components/sambung-buttons";
import { Chip, Isi, Judul2, KepalaHalaman, Kosong, kartu } from "@/components/ui";

export const dynamic = "force-dynamic";

const NAMA_PLATFORM: Record<string, string> = { youtube: "YouTube", tiktok: "TikTok", meta: "Instagram" };

export default async function AkunPage() {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?next=/akun");
  const data = await apiGet("/social");
  const daftar: { platform: string; account_name: string }[] = data?.items ?? [];

  return (
    <>
      <KepalaHalaman
        id="judul-akun"
        penanda="Akun media sosial"
        judul="Sambungkan akun tempat klip tayang"
        deskripsi="Klip organik diposting dari akunmu sendiri agar views terbaca resmi."
      />
      <Isi className="max-w-3xl space-y-12">
        <section aria-labelledby="judul-sambung">
          <Judul2 id="judul-sambung">Sambungkan akun</Judul2>
          <div className="mt-4">
            <SambungButtons />
          </div>
        </section>

        <section aria-labelledby="judul-tersambung">
          <Judul2 id="judul-tersambung">Tersambung</Judul2>
          {!data ? (
            <div className="mt-4">
              <Kosong gagal>Daftar akun belum bisa dimuat karena API backend tidak tersambung.</Kosong>
            </div>
          ) : daftar.length === 0 ? (
            <div className="mt-4">
              <Kosong>Belum ada akun tersambung. Pilih YouTube di atas untuk memulai.</Kosong>
            </div>
          ) : (
            <ul className={`${kartu} mt-4 divide-y divide-stone-200`}>
              {daftar.map((s) => (
                <li key={s.platform} className="flex items-center justify-between gap-4 p-4">
                  <span className="font-medium">
                    {NAMA_PLATFORM[s.platform] ?? s.platform}
                    {s.account_name && <span className="font-normal text-stone-700"> · {s.account_name}</span>}
                  </span>
                  <Chip nada="aktif">Tersambung</Chip>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Isi>
    </>
  );
}
