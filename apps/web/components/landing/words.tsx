/**
 * Memecah judul jadi kata, supaya tiap kata bisa naik sendiri saat masuk layar.
 * Frasa `aksen` dicetak dengan warna aksen. Kalau JS mati, kata tetap tampil.
 */
export function Words({ text, aksen }: { text: string; aksen?: string }) {
  const mulai = aksen ? text.indexOf(aksen) : -1;
  const sebelum = mulai >= 0 ? text.slice(0, mulai) : text;
  const sesudah = mulai >= 0 ? text.slice(mulai + (aksen?.length ?? 0)) : "";

  return (
    <>
      {kata(sebelum)}
      {mulai >= 0 && <span className="text-cl-accent">{kata(aksen ?? "")}</span>}
      {kata(sesudah)}
    </>
  );
}

function kata(teks: string) {
  return teks
    .split(/\s+/)
    .filter(Boolean)
    .map((k, i) => (
      <span key={`${i}-${k}`}>
        <span className="inline-block overflow-hidden align-top pb-[0.1em] -mb-[0.1em]">
          <span className="cl-word inline-block">{k}</span>
        </span>{" "}
      </span>
    ));
}
