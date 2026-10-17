import Link from "next/link";
import { HeaderNav } from "@/components/landing/header-nav";
import { Reveal } from "@/components/landing/reveal";
import { SceneBackground } from "@/components/landing/scene-background";
import { StepList } from "@/components/landing/step-list";
import { HighlightMap, LogJob, RoleCards, ViewsChart } from "@/components/landing/widgets";
import { Words } from "@/components/landing/words";

const langkah = ["Unggah video panjang", "Analisis mencari momen", "Sunting di Studio", "Render klip vertikal"];

const fakta = [
  "Unggah MP4 sampai 2 GB",
  "Sampai 30 menit per video",
  "Judul untuk YouTube dan TikTok",
  "1 kredit per video"
];

const statusRilis = [
  { label: "Sudah jalan", isi: "Daftar akun, verifikasi email, unggah langsung ke penyimpanan, dan antrean job di dasbor." },
  { label: "Menyusul", isi: "Analisis dan render otomatis, plus API backend untuk pasar, kredit, dan studio." },
  { label: "Menyusul", isi: "Gerak uang nyata lewat Xendit, dan penyambungan akun TikTok yang menunggu verifikasi." }
];

// Kelas tombol disatukan supaya primer dan sekunder sama di terang maupun gelap.
const tombolPrimer =
  "inline-flex min-h-[44px] items-center justify-center rounded-md bg-cl-accent px-6 font-mono text-xs uppercase text-cl-accent-ink transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-cl-accent-hi";
const tombolSekunder =
  "inline-flex min-h-[44px] items-center justify-center rounded-md bg-white/10 px-6 font-mono text-xs uppercase text-white transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white/20";

export default function Beranda() {
  return (
    <>
      <SceneBackground />
      <HeaderNav />

      <main id="isi" className="relative z-[1]">
        {/* Hero */}
        <section aria-labelledby="judul-utama" className="gelap relative flex min-h-[max(760px,100svh)] items-end pb-[90px] pt-[140px] text-white max-[980px]:pb-[70px]">
          <div className="mx-auto grid w-full max-w-[1320px] items-end gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3.4fr)]">
            <Reveal kata>
              <h1
                id="judul-utama"
                className="m-0 text-[clamp(46px,7.6vw,112px)] font-light leading-[0.98] tracking-[-0.04em] text-balance"
              >
                <Words text="Video panjang masuk. Klip siap tayang keluar." aksen="siap tayang" />
              </h1>
            </Reveal>
            <Reveal delay={0.5}>
              <div>
                <p className="mb-6 max-w-[36ch] text-[17px] leading-normal tracking-[0.01em] text-[#eadff2]">
                  Dua cara mengerjakannya. Biarkan analisis otomatis mencari momennya, atau buka kampanye dan
                  biarkan editor yang memotong. Videomu tetap di penyimpananmu.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/unggah" className={tombolPrimer}>
                    Unggah video panjang
                  </Link>
                  <Link href="/pasar" className={tombolSekunder}>
                    Lihat pasar proyek
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
          <a
            href="#marquee"
            className="absolute bottom-7 left-4 flex min-h-[44px] items-center gap-2.5 font-mono text-[11px] uppercase text-cl-muted sm:left-6"
          >
            Gulir <span aria-hidden="true">↓</span>
          </a>
        </section>

        {/* Fakta berjalan */}
        <div id="marquee" className="gelap relative z-[1] overflow-hidden pb-[90px] pt-[26px] text-white [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex w-max animate-mq items-center gap-16" aria-label="Fakta singkat">
            {[0, 1].map((salinan) => (
              <div key={salinan} className="flex items-center gap-16" aria-hidden={salinan === 1 || undefined}>
                <span className="font-mono text-[11px] uppercase text-cl-muted">Fakta singkat</span>
                {fakta.map((f) => (
                  <span key={`${salinan}-${f}`} className="whitespace-nowrap text-2xl tracking-[-0.02em] opacity-90">
                    {f}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Cara kerja: panel terang yang menimpa section gelap */}
        <section
          id="cara-kerja"
          aria-labelledby="judul-cara"
          data-panel
          className="relative z-[3] -my-[30px] rounded-[24px] bg-cl-paper py-[140px] pb-[170px] text-cl-ink shadow-[0_-20px_60px_rgba(0,0,0,0.35)] max-[560px]:py-[100px] max-[560px]:pb-[130px]"
        >
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-[130px] grid gap-12 max-[980px]:mb-[60px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Reveal>
                <p className="m-0 max-w-[22ch] text-base leading-[1.35]">Klip vertikal tanpa jam-jam di depan timeline</p>
              </Reveal>
              <Reveal kata>
                <h2 id="judul-cara" className="m-0 text-[clamp(34px,4.6vw,66px)] font-light leading-[1.02] tracking-[-0.035em] text-balance">
                  <Words text="Dibuat untuk kreator, yang mengejar jangkauan" aksen="yang mengejar jangkauan" />
                </h2>
              </Reveal>
            </div>

            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="sticky top-[130px] max-[980px]:static max-[980px]:mb-[46px]">
                <p className="mb-[22px] font-mono text-xs uppercase tracking-[-0.02em]">Cara kerja</p>
                <StepList items={langkah} />
              </div>

              <div className="mx-auto grid max-w-[600px] gap-[110px] max-[980px]:max-w-none max-[980px]:gap-[70px]">
                <Blok nomor={0} judul="Dari unggah pertama, langsung masuk antrean." isi="Berkas MP4 dikirim langsung ke penyimpanan, jadi videomu tidak mampir ke server web. Status tiap job bisa kamu pantau di dasbor.">
                  <div className="relative grid aspect-[4/3.2] place-items-center overflow-hidden rounded-xl bg-[#14081b] max-[560px]:aspect-square [background:radial-gradient(80%_90%_at_70%_100%,#a3238a,transparent_70%),radial-gradient(60%_60%_at_10%_0%,#5a1257,transparent_70%),#14081b]">
                    <div className="w-[78%] rounded-lg bg-[#f4f6fa]/95 px-[18px] pb-3 pt-[18px] text-cl-ink shadow-[0_24px_60px_rgba(0,0,0,0.45)] max-[560px]:w-[92%]">
                      <p className="mb-3 flex justify-between gap-3 font-mono text-[10.5px] uppercase text-[#6d79a8]">
                        <span>Batas yang berlaku</span>
                        <span>jalur instan</span>
                      </p>
                      <Spek n="Ukuran berkas" v="2 GB" utama />
                      <Spek n="Durasi video" v="30 menit" />
                      <Spek n="Biaya" v="1 kredit" />
                    </div>
                  </div>
                </Blok>

                <Blok nomor={1} judul="Momen ditandai sebelum kamu mencarinya." isi="Analisis memecah video jadi beberapa momen dan menandai hook tiap momen. Klip dimulai dari kalimat pembuka, bukan dari basa-basi.">
                  <div className="relative grid aspect-[4/3.2] place-items-center overflow-hidden rounded-xl border border-[#dde4ea] bg-cl-slate max-[560px]:aspect-square">
                    <span className="absolute left-3.5 top-3.5 z-[2] bg-cl-ink px-2 py-1 font-mono text-[10.5px] uppercase text-white">Ilustrasi</span>
                    <HighlightMap />
                  </div>
                </Blok>

                <Blok nomor={2} judul="Setiap penyimpanan jadi versi baru." isi="Titik potong, efek per beat, dan judul tersimpan di tiap momen. Kamu bisa kembali ke versi sebelumnya kapan saja.">
                  <div className="relative grid aspect-[4/3.2] place-items-center overflow-hidden rounded-xl bg-cl-night max-[560px]:aspect-square">
                    <span className="absolute left-3.5 top-3.5 z-[2] bg-cl-ink px-2 py-1 font-mono text-[10.5px] uppercase text-white">Log job</span>
                    <LogJob />
                  </div>
                </Blok>

                <Blok nomor={3} judul="Views datang dari akunmu sendiri." isi="Klip organic tayang dari akun yang kamu sambungkan, jadi angka views berasal dari sumber resmi. Akun TikTok masih menunggu verifikasi dari pihak TikTok.">
                  <div className="relative grid aspect-[4/3.2] place-items-center overflow-hidden rounded-xl border border-[#dde4ea] bg-cl-slate max-[560px]:aspect-square">
                    <ViewsChart />
                  </div>
                </Blok>
              </div>
            </div>
          </div>
        </section>

        {/* Keamanan dan peran */}
        <section id="keamanan" aria-labelledby="judul-keamanan" className="gelap relative py-[230px] pb-[150px] text-white max-[980px]:py-[170px] max-[980px]:pb-[100px]">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-[220px] grid gap-12 max-[980px]:mb-[120px] lg:grid-cols-[minmax(0,5fr)_minmax(0,5fr)]">
              <Reveal>
                <p className="m-0 font-mono text-xs uppercase">Keamanan</p>
                <h2 id="judul-keamanan" className="mb-7 mt-[22px] text-[clamp(34px,4.6vw,66px)] font-light leading-[1.02] tracking-[-0.035em] text-balance">
                  Uang dan data tetap <span className="text-cl-accent">terjaga</span>
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/keamanan" className={tombolPrimer}>
                    Buka halaman keamanan
                  </Link>
                  <Link href="/masuk" className={tombolSekunder}>
                    Masuk
                  </Link>
                </div>
              </Reveal>
              <div className="grid content-start gap-[30px] pt-2.5">
                <Poin judul="Verifikasi dua langkah" isi="Bisa kamu nyalakan untuk akun yang memegang saldo kredit dan rekening pencairan." />
                <Poin judul="Rekening pencairan terenkripsi" isi="Nomor rekening disimpan terenkripsi di server. Mengganti rekening mereset status verifikasinya." />
                <Poin judul="Pemisahan data" isi="Setiap baris dijaga row level security, jadi baris milik orang lain tidak bisa dibaca dari sisi klien." />
                <Poin judul="Dana kampanye dicatat sebagai escrow" isi="Gerak uang nyata lewat Xendit belum aktif. Statusnya ditampilkan apa adanya." />
              </div>
            </div>

            <div id="peran" className="flex flex-col items-center gap-6 text-center">
              <Reveal kata>
                <h2 id="judul-peran" className="m-0 text-[clamp(32px,3.6vw,50px)] font-light leading-[1.02] tracking-[-0.035em] text-balance">
                  <Words text="Untuk yang punya videonya, dan yang memotongnya" aksen="dan yang memotongnya" />
                </h2>
              </Reveal>
              <RoleCards />
              <Link href="/kampanye/baru" className={`${tombolPrimer} mt-3.5`}>
                Tulis brief kampanye
              </Link>
            </div>
          </div>
        </section>

        {/* Status rilis: panel slate */}
        <section
          id="status"
          aria-labelledby="judul-status"
          data-panel
          className="relative z-[3] -my-[30px] rounded-[24px] bg-cl-slate py-[170px] pb-[150px] text-cl-ink shadow-[0_-20px_60px_rgba(0,0,0,0.35)] max-[980px]:py-[120px]"
        >
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-[70px] grid gap-12 max-[980px]:gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Reveal>
                <p className="m-0 font-mono text-xs uppercase">Status rilis</p>
              </Reveal>
              <Reveal kata>
                <h2 id="judul-status" className="m-0 text-[clamp(34px,4.6vw,66px)] font-light leading-[1.02] tracking-[-0.035em] text-balance">
                  <Words text="Yang sudah jalan, dan yang menyusul" aksen="dan yang menyusul" />
                </h2>
              </Reveal>
            </div>
            <ul className="grid gap-3 md:grid-cols-3">
              {statusRilis.map((s, i) => (
                <li key={s.isi}>
                  <Reveal delay={i * 0.08}>
                    <article className="flex min-h-[190px] flex-col gap-[18px] rounded bg-white p-4 pb-7 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(23,43,118,0.12)]">
                      <p className="m-0 font-mono text-[10.5px] uppercase text-cl-ink">{s.label}</p>
                      <p className="m-0 text-[19px] leading-tight tracking-[-0.015em]">{s.isi}</p>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ajakan */}
        <section aria-labelledby="judul-ajakan" className="gelap relative py-24 text-white sm:py-36">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <Reveal kata>
              <h2 id="judul-ajakan" className="m-0 max-w-3xl text-[40px] font-light leading-[1.02] tracking-[-0.025em] sm:text-[60px] text-balance">
                <Words text="Mulai dari satu video panjang." />
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mb-0 mt-6 max-w-xl text-cl-muted">
                Buat akun, verifikasi email, lalu unggah video pertamamu. Saldo kredit dipakai hanya saat kamu
                menjalankan jalur instan.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/daftar" className={tombolPrimer}>
                  Buat akun
                </Link>
                <Link href="/masuk" className={tombolSekunder}>
                  Masuk
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="gelap relative z-[1] pb-10 pt-[200px] text-white">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-[360px] grid gap-8 max-[980px]:mb-[200px] lg:grid-cols-[minmax(0,5fr)_minmax(0,3.5fr)_minmax(0,3.5fr)] lg:gap-12">
            <div>
              <Link href="/" className="mb-[22px] flex min-h-[44px] items-center gap-2.5 text-[19px]">
                <span aria-hidden="true" className="flex h-[18px] items-center gap-[2.5px]">
                  <i className="block h-[6px] w-[3px] rounded-[1px] bg-cl-accent" />
                  <i className="block h-4 w-[3px] rounded-[1px] bg-cl-accent" />
                  <i className="block h-[11px] w-[3px] rounded-[1px] bg-cl-accent" />
                  <i className="block h-[6px] w-[3px] rounded-[1px] bg-cl-accent" />
                </span>
                TukangClip
              </Link>
              <p className="m-0 max-w-[30ch] text-sm text-cl-muted">Potong video panjang jadi klip vertikal.</p>
            </div>
            <nav aria-labelledby="judul-produk">
              <h2 id="judul-produk" className="mb-3.5 text-xs font-normal text-cl-muted">Produk</h2>
              <ul className="m-0 grid list-none gap-1 p-0 text-[13px]">
                <FootLink href="/pasar" label="Pasar proyek" />
                <FootLink href="/kredit" label="Kredit AI" />
                <FootLink href="/akun" label="Akun sosial" />
                <FootLink href="/keamanan" label="Keamanan" />
              </ul>
            </nav>
            <nav aria-labelledby="judul-akun">
              <h2 id="judul-akun" className="mb-3.5 text-xs font-normal text-cl-muted">Akun</h2>
              <ul className="m-0 grid list-none gap-1 p-0 text-[13px]">
                <FootLink href="/masuk" label="Masuk" />
                <FootLink href="/daftar" label="Buat akun" />
                <FootLink href="/dasbor" label="Dasbor" />
              </ul>
            </nav>
          </div>
          <div className="mt-20 flex flex-wrap justify-between gap-4 border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)] pt-5 text-[12.5px] text-cl-muted">
            <span>© 2026 TukangClip</span>
            <span>Verifikasi dua langkah dan rekening terenkripsi tersedia di halaman keamanan.</span>
          </div>
        </div>
      </footer>
    </>
  );
}

function Blok({ nomor, judul, isi, children }: { nomor: number; judul: string; isi: string; children: React.ReactNode }) {
  return (
    <article data-step={nomor} className="text-cl-ink">
      <Reveal>
        {children}
        <h3 className="mb-2 mt-[26px] text-xl font-normal leading-tight tracking-[-0.015em]">{judul}</h3>
        <p className="m-0 max-w-[44ch] text-[15px] leading-normal text-[#3b4a86]">{isi}</p>
      </Reveal>
    </article>
  );
}

function Spek({ n, v, utama = false }: { n: string; v: string; utama?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-[#dfe4ee] py-3">
      <span className="font-mono text-[10.5px] uppercase">{n}</span>
      <span className={`text-[22px] font-light tabular-nums ${utama ? "text-cl-accent" : ""}`}>{v}</span>
    </div>
  );
}

function Poin({ judul, isi }: { judul: string; isi: string }) {
  return (
    <Reveal>
      <h3 className="mb-1.5 flex items-center gap-2 text-[15px] font-medium before:block before:h-[5px] before:w-[5px] before:rounded-[1px] before:bg-cl-accent">
        {judul}
      </h3>
      <p className="m-0 max-w-[48ch] text-sm leading-normal text-cl-muted">{isi}</p>
    </Reveal>
  );
}

function FootLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="inline-flex min-h-[44px] items-center transition-colors hover:text-cl-accent">
        {label}
      </Link>
    </li>
  );
}
