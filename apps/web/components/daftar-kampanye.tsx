import { KartuKampanye } from "@/components/kartu-kampanye";
import { Kosong } from "@/components/ui";
import { ambilKampanye, type Urutan } from "@/lib/kampanye";

const PILIHAN: { nilai: Urutan; label: string }[] = [
  { nilai: "terbaru", label: "Terbaru" },
  { nilai: "budget", label: "Sisa budget terbesar" },
  { nilai: "rate", label: "Rate tertinggi" }
];

export function bacaUrutan(v?: string): Urutan {
  return PILIHAN.find((p) => p.nilai === v)?.nilai ?? "terbaru";
}

/** Daftar kampanye terbuka dengan pilihan urutan. Dipakai /jelajah (publik) dan /pasar (clipper). */
export async function DaftarKampanye({
  basePath,
  urut,
  kosongUntukKreator
}: {
  basePath: string;
  urut: Urutan;
  kosongUntukKreator?: boolean;
}) {
  const daftar = await ambilKampanye(urut);

  return (
    <>
      <nav aria-label="Urutkan kampanye">
        <ul className="flex flex-wrap gap-2">
          {PILIHAN.map((p) => (
            <li key={p.nilai}>
              <a
                href={`${basePath}?urut=${p.nilai}`}
                aria-current={p.nilai === urut ? "page" : undefined}
                className={`inline-flex min-h-[44px] items-center rounded-[7px] px-4 font-mono text-xs uppercase transition-colors ${
                  p.nilai === urut
                    ? "bg-cl-ink text-white"
                    : "border-2 border-stone-300 bg-white hover:border-cl-ink"
                }`}
              >
                {p.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {daftar === null ? (
        <div className="mt-6">
          <Kosong gagal>
            Daftar kampanye belum bisa dimuat karena API backend tidak tersambung. Muat ulang halaman ini
            beberapa saat lagi.
          </Kosong>
        </div>
      ) : daftar.length === 0 ? (
        <div className="mt-6">
          <Kosong>
            <p>Belum ada kampanye terbuka saat ini.</p>
            {kosongUntukKreator && (
              <p className="mt-2">
                Punya video panjang yang ingin disebar?{" "}
                <a href="/kampanye/baru" className="font-medium underline underline-offset-4">
                  Buka kampanye pertama
                </a>
                .
              </p>
            )}
          </Kosong>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {daftar.map((k) => (
            <li key={k.id}>
              <KartuKampanye k={k} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
