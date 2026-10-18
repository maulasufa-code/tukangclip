import Link from "next/link";
import { KartuKampanye } from "@/components/kartu-kampanye";
import { Logo } from "@/components/logo";
import { HeaderNav } from "@/components/landing/header-nav";
import { ambilPengguna } from "@/lib/sesi";
import { Reveal } from "@/components/landing/reveal";
import { SceneBackground } from "@/components/landing/scene-background";
import { Simulator } from "@/components/landing/simulator";
import { StepList } from "@/components/landing/step-list";
import { ViewsChart } from "@/components/landing/widgets";
import { Words } from "@/components/landing/words";
import { BIAYA_PLATFORM_PERSEN, MINIMAL_TOPUP, rincianTopup, rupiah } from "@/lib/harga";
import { ambilKampanye } from "@/lib/kampanye";

const langkah = ["Tulis brief", "Danai kampanye", "Pilih clipper", "Setujui klipnya", "Bayar per views"];

const fakta = [
  "Bayar per 1.000 views",
  "Budget 100% untuk clipper",
  `Biaya platform ${BIAYA_PLATFORM_PERSEN}%`,
  "Klip disetujui sebelum tayang",
  "Tenggat 72 jam per proyek"
];

const contohTopup = rincianTopup(10_000_000);

const tanya = [
  {
    q: "Cocok untuk siapa?",
    a: "Untuk pemilik video panjang, seperti podcast, siaran langsung, film, atau brand, yang ingin videonya tersebar sebagai klip pendek di banyak akun, bukan hanya dari akun resmi."
  },
  {
    q: "Biaya dihitung dari apa?",
    a: `Kamu mengisi budget dan rate per 1.000 views. Budget itu utuh untuk clipper, dan biaya platform ${BIAYA_PLATFORM_PERSEN}% ditambahkan di atasnya. Contoh: budget ${rupiah(contohTopup.budget)} ditambah ${rupiah(contohTopup.biaya)}, total ${rupiah(contohTopup.total)}. Minimal budget ${rupiah(MINIMAL_TOPUP)}.`
  },
  {
    q: "Kapan clipper dibayar?",
    a: "Setelah klip kamu setujui dan tayang. Bayaran dihitung dari views akun resmi: views dibagi 1.000 dikali rate, tidak lebih dari batas per klip dan sisa budget. Gerak uang nyata lewat Xendit belum aktif, jadi saat ini dana masih dicatat sebagai escrow."
  },
  {
    q: "Bagaimana kalau ada views palsu?",
    a: "Views diambil dari akun yang disambungkan clipper, bukan dari laporan clipper. Kalau ada klip yang mencurigakan, pembuat kampanye bisa menandainya. Klip yang ditandai tidak dibayar sampai selesai diperiksa."
  },
  {
    q: "Bagaimana dengan brand safety?",
    a: "Klip tidak bisa ditandai tayang sebelum kamu setujui. Kamu melihat setiap klip yang masuk, lalu menyetujui atau menolaknya."
  },
  {
    q: "Berapa proyek yang bisa diambil clipper?",
    a: "Maksimal 3 proyek aktif sekaligus. Setelah lamaran diterima, clipper punya waktu 72 jam untuk mengirim klip."
  }
];

const statusRilis = [
  { label: "Sudah jalan", isi: "Daftar akun, verifikasi email, unggah langsung ke penyimpanan, dan antrean job di dasbor." },
  { label: "Menyusul", isi: "Analisis dan render otomatis, plus API backend untuk kampanye, kredit, dan studio di semua halaman." },
  { label: "Menyusul", isi: "Gerak uang nyata lewat Xendit, dan penyambungan akun TikTok yang menunggu verifikasi." }
];

// Kelas tombol disatukan supaya primer dan sekunder sama di terang maupun gelap.
const tombolPrimer =
  "inline-flex min-h-[44px] items-center justify-center rounded-md bg-cl-accent px-6 font-mono text-xs uppercase text-cl-accent-ink transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-cl-accent-hi";
const tombolSekunder =
  "inline-flex min-h-[44px] items-center justify-center rounded-md bg-white/10 px-6 font-mono text-xs uppercase text-white transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white/20";
const tombolTinta =
  "inline-flex min-h-[44px] items-center justify-center rounded-md bg-cl-ink px-6 font-mono text-xs uppercase text-cl-accent transition-transform duration-200 hover:-translate-y-0.5";

export default async function Beranda() {
  const [kampanye, pengguna] = await Promise.all([ambilKampanye("terbaru"), ambilPengguna()]);

  return (
    <>
      <SceneBackground />
      <HeaderNav sudahMasuk={pengguna !== null} />

      <main id="isi" className="relative z-[1]">
        {/* Hero */}
        <section aria-labelledby="judul-utama" className="gelap relative flex min-h-[max(760px,100svh)] items-end pb-[90px] pt-[140px] text-white max-[980px]:pb-[70px]">
          <div className="mx-auto grid w-full max-w-[1320px] items-end gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3.4fr)]">
            <Reveal kata>
              <h1
                id="judul-utama"
                className="m-0 text-[clamp(46px,7.6vw,112px)] font-light leading-[0.98] tracking-[-0.04em] text-balance"
              >
                <Words text="Yang instan-instan aja. Clipper jago ngumpul di sini!" aksen="Clipper jago ngumpul di sini!" />
              </h1>
            </Reveal>
            <Reveal delay={0.5}>
              <div>
                <p className="mb-6 max-w-[36ch] text-[17px] leading-normal tracking-[0.01em] text-[#f3e8cc]">
                  Jadikan video panjangmu makin banyak viewers. Para tukang akan membantu memotong videomu jadi klip pendek dan memposting dari akun
                  mereka sendiri. Kamu hanya membayar views yang tercatat. 
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/kampanye/baru" className={tombolPrimer}>
                    Bikin kampanye
                  </Link>
                  <Link href="/daftar?peran=clipper" className={tombolSekunder}>
                    Jadi clipper
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
                {fakta.map((f) => (
                  <span key={`${salinan}-${f}`} className="whitespace-nowrap text-2xl tracking-[-0.02em] opacity-90">
                    {f}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Alur kampanye: panel kuning yang menimpa section gelap */}
        <section
          id="alur"
          aria-labelledby="judul-alur"
          data-panel
          className="relative z-[3] -my-[30px] rounded-[24px] bg-cl-sun py-[140px] pb-[170px] text-cl-ink shadow-[0_-20px_60px_rgba(0,0,0,0.35)] max-[560px]:py-[100px] max-[560px]:pb-[130px]"
        >
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-[130px] grid gap-12 max-[980px]:mb-[60px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Reveal>
                <p className="m-0 max-w-[24ch] text-base leading-[1.35]">Simple dan mudah. Semua dalam satu platform.</p>
              </Reveal>
              <Reveal kata>
                <h2 id="judul-alur" className="m-0 text-[clamp(34px,4.6vw,66px)] font-light leading-[1.02] tracking-[-0.035em] text-balance">
                  <Words text="Lima langkah fleksibel. Atur sepuasnya!" aksen="Atur sepuasnya!" warna="text-cl-rust" />
                </h2>
              </Reveal>
            </div>

            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="sticky top-[130px] max-[980px]:static max-[980px]:mb-[46px]">
                <p className="mb-[22px] font-mono text-xs uppercase tracking-[-0.02em]">Alurnya:</p>
                <StepList items={langkah} />
              </div>

              <div className="mx-auto grid max-w-[600px] gap-[110px] max-[980px]:max-w-none max-[980px]:gap-[70px]">
                <Blok nomor={0} judul="Tulis brief dari video panjangmu." isi="Isi judul, arahan untuk clipper, dan link video mentah. Tetapkan rate per 1.000 views dan batas bayar per klip.">
                  <Ilustrasi gelap>
                    <Kartu judul="Brief kampanye">
                      <Spek n="Video mentah" v="Link Drive atau YouTube" />
                      <Spek n="Rate per 1.000 views" v="Kamu tentukan" />
                      <Spek n="Batas per klip" v="Kamu tentukan" />
                    </Kartu>
                  </Ilustrasi>
                </Blok>

                <Blok nomor={1} judul="Danai budgetnya lewat Xendit." isi={`Seluruh budget masuk escrow kampanye untuk clipper. Biaya platform ${BIAYA_PLATFORM_PERSEN}% dibayar terpisah di atasnya.`}>
                  <Ilustrasi>
                    <Kartu judul="Contoh pendanaan">
                      <Spek n="Budget untuk clipper" v={rupiah(contohTopup.budget)} utama />
                      <Spek n={`Biaya platform ${BIAYA_PLATFORM_PERSEN}%`} v={rupiah(contohTopup.biaya)} />
                      <Spek n="Total dibayar" v={rupiah(contohTopup.total)} />
                    </Kartu>
                  </Ilustrasi>
                </Blok>

                <Blok nomor={2} judul="Pilih clipper yang melamar." isi="Clipper melamar dari halaman kampanye. Kamu yang menerima atau menolak. Setelah diterima, clipper punya 72 jam untuk mengirim klip.">
                  <Ilustrasi>
                    <Kartu judul="Ilustrasi pelamar">
                      <Spek n="Clipper 1" v="Diterima, tenggat 72 jam" />
                      <Spek n="Clipper 2" v="Menunggu keputusanmu" />
                      <Spek n="Clipper 3" v="Ditolak" />
                    </Kartu>
                  </Ilustrasi>
                </Blok>

                <Blok nomor={3} judul="Setujui klip sebelum tayang." isi="Setiap klip masuk ke kampanyemu dulu. Klip yang belum kamu setujui tidak bisa ditandai tayang.">
                  <Ilustrasi gelap>
                    <Kartu judul="Status satu klip">
                      <Spek n="Dikirim clipper" v="Selesai" />
                      <Spek n="Kamu setujui" v="Selesai" />
                      <Spek n="Tayang di akun clipper" v="Menunggu" utama />
                    </Kartu>
                  </Ilustrasi>
                </Blok>

                <Blok nomor={4} judul="Bayar sesuai views yang tercatat." isi="Views diambil dari akun resmi clipper. Bayaran per klip dihitung per 1.000 views, tidak lebih dari batas per klip dan sisa budget.">
                  <Ilustrasi>
                    <ViewsChart />
                  </Ilustrasi>
                </Blok>
              </div>
            </div>
          </div>
        </section>

        {/* Harga */}
        <section id="harga" aria-labelledby="judul-harga" className="gelap relative py-[200px] pb-[150px] text-white max-[980px]:py-[150px] max-[980px]:pb-[100px]">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-14 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Reveal>
                <p className="m-0 font-mono text-xs uppercase">Harga</p>
              </Reveal>
              <Reveal>
                <h2 id="judul-harga" className="m-0 text-[clamp(34px,4.6vw,66px)] font-light leading-[1.02] tracking-[-0.035em] text-balance">
                  Bayar views yang terjadi, bukan perkiraan
                </h2>
                <p className="mb-0 mt-6 max-w-[52ch] text-cl-muted">
                  Satu skema untuk semua kampanye. Budget yang kamu isi utuh untuk clipper, biaya platform{" "}
                  {BIAYA_PLATFORM_PERSEN}% ditambahkan terpisah, dan minimal budget {rupiah(MINIMAL_TOPUP)}. Coba hitung
                  di bawah.
                </p>
              </Reveal>
            </div>
            <Reveal>
              <Simulator />
            </Reveal>
          </div>
        </section>

        {/* Kampanye berjalan: panel krem */}
        <section
          id="kampanye"
          aria-labelledby="judul-kampanye"
          data-panel
          className="relative z-[3] -my-[30px] rounded-[24px] bg-cl-slate py-[130px] text-cl-ink shadow-[0_-20px_60px_rgba(0,0,0,0.35)] max-[980px]:py-[100px]"
        >
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 id="judul-kampanye" className="m-0 max-w-[18ch] text-[clamp(34px,4.6vw,66px)] font-light leading-[1.02] tracking-[-0.035em]">
                Kampanye yang sedang berjalan
              </h2>
              <Link href="/jelajah" className={tombolTinta}>
                Lihat semua kampanye
              </Link>
            </div>
            {kampanye === null ? (
              <p className="m-0 max-w-[60ch] rounded-lg border border-dashed border-cl-ink/30 p-6">
                Daftar kampanye belum bisa dimuat karena API backend belum tersambung. Kampanye akan muncul di sini
                begitu tersambung.
              </p>
            ) : kampanye.length === 0 ? (
              <p className="m-0 max-w-[60ch] rounded-lg border border-dashed border-cl-ink/30 p-6">
                Belum ada kampanye terbuka.{" "}
                <Link href="/kampanye/baru" className="inline-flex min-h-[44px] items-center underline">
                  Buka kampanye pertama
                </Link>{" "}
                dari video panjangmu.
              </p>
            ) : (
              <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
                {kampanye.slice(0, 3).map((k) => (
                  <li key={k.id}>
                    <KartuKampanye k={k} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Untuk clipper */}
        <section id="clipper" aria-labelledby="judul-clipper" className="gelap relative py-[230px] pb-[150px] text-white max-[980px]:py-[170px] max-[980px]:pb-[100px]">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,5fr)]">
              <Reveal>
                <p className="m-0 font-mono text-xs uppercase">Untuk clipper</p>
                <h2 id="judul-clipper" className="mb-6 mt-[22px] text-[clamp(40px,6vw,88px)] font-light leading-[0.98] tracking-[-0.04em]">
                  Potong. Posting. <span className="text-cl-accent">Dibayar.</span>
                </h2>
                <p className="mb-7 max-w-[44ch] text-cl-muted">
                  Ambil kampanye yang cocok, potong video mentahnya di Studio, lalu posting dari akunmu sendiri. Bayaran
                  dihitung per 1.000 views dari akun yang kamu sambungkan.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/daftar?peran=clipper" className={tombolPrimer}>
                    Daftar jadi clipper
                  </Link>
                  <Link href="/jelajah" className={tombolSekunder}>
                    Lihat kampanye
                  </Link>
                </div>
              </Reveal>
              <div className="grid content-start gap-[30px] pt-2.5">
                <Poin judul="Rate terlihat sebelum melamar" isi="Rate per 1.000 views, batas bayar per klip, dan sisa budget tampil di setiap kampanye." />
                <Poin judul="Maksimal 3 proyek aktif" isi="Supaya tiap proyek selesai. Setelah lamaran diterima, kamu punya 72 jam untuk mengirim klip." />
                <Poin judul="Rekening pencairan terenkripsi" isi="Nomor rekening disimpan terenkripsi di server. Mengganti rekening mereset status verifikasinya." />
                <Poin judul="Verifikasi dua langkah" isi="Bisa kamu nyalakan untuk akun yang menerima bayaran." />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ dan status rilis: panel krem */}
        <section
          id="faq"
          aria-labelledby="judul-faq"
          data-panel
          className="relative z-[3] -my-[30px] rounded-[24px] bg-cl-slate py-[150px] pb-[150px] text-cl-ink shadow-[0_-20px_60px_rgba(0,0,0,0.35)] max-[980px]:py-[110px]"
        >
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <h2 id="judul-faq" className="m-0 text-[clamp(34px,4.6vw,66px)] font-light leading-[1.02] tracking-[-0.035em]">
                Yang sering ditanyakan
              </h2>
              <div className="border-t border-cl-ink/20">
                {tanya.map((t) => (
                  <details key={t.q} className="group border-b border-cl-ink/20">
                    <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg [&::-webkit-details-marker]:hidden">
                      {t.q}
                      <span aria-hidden="true" className="text-2xl font-light transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="m-0 max-w-[60ch] pb-5 text-[15px] leading-normal text-[#4a3600]">{t.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <div id="status" className="mt-[130px]">
              <h2 className="mb-8 mt-0 text-[clamp(26px,3vw,40px)] font-light leading-tight tracking-[-0.03em]">
                Yang sudah jalan, dan yang menyusul
              </h2>
              <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
                {statusRilis.map((s) => (
                  <li key={s.isi}>
                    <article className="flex min-h-[170px] flex-col gap-[18px] rounded bg-white p-4 pb-7">
                      <p className="m-0 font-mono text-[10.5px] uppercase text-cl-ink">{s.label}</p>
                      <p className="m-0 text-[19px] leading-tight tracking-[-0.015em]">{s.isi}</p>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
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
                Pemilik video membuka kampanye, clipper mengambil proyeknya. Keduanya mulai dari akun yang sama.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/kampanye/baru" className={tombolPrimer}>
                  Buka kampanye
                </Link>
                <Link href="/daftar?peran=clipper" className={tombolSekunder}>
                  Daftar jadi clipper
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
                <Logo className="h-[22px] w-auto text-cl-accent" />
                TukangClip
              </Link>
              <p className="m-0 max-w-[30ch] text-sm text-cl-muted">Video panjang dipotong clipper, dibayar per views.</p>
            </div>
            <nav aria-labelledby="judul-produk">
              <h2 id="judul-produk" className="mb-3.5 text-xs font-normal text-cl-muted">Produk</h2>
              <ul className="m-0 grid list-none gap-1 p-0 text-[13px]">
                <FootLink href="/jelajah" label="Jelajah kampanye" />
                <FootLink href="/kampanye/baru" label="Buka kampanye" />
                <FootLink href="/kredit" label="Kredit AI" />
                <FootLink href="/keamanan" label="Keamanan" />
              </ul>
            </nav>
            <nav aria-labelledby="judul-akun">
              <h2 id="judul-akun" className="mb-3.5 text-xs font-normal text-cl-muted">Akun</h2>
              <ul className="m-0 grid list-none gap-1 p-0 text-[13px]">
                {pengguna ? (
                  <FootLink href="/dasbor" label="Dasbor" />
                ) : (
                  <>
                    <FootLink href="/masuk" label="Masuk" />
                    <FootLink href="/daftar" label="Buat akun" />
                  </>
                )}
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
    <article id={`langkah-${nomor}`} data-step={nomor} className="text-cl-ink">
      <Reveal>
        {children}
        <h3 className="mb-2 mt-[26px] text-xl font-normal leading-tight tracking-[-0.015em]">{judul}</h3>
        <p className="m-0 max-w-[44ch] text-[15px] leading-normal text-[#4a3600]">{isi}</p>
      </Reveal>
    </article>
  );
}

function Ilustrasi({ gelap = false, children }: { gelap?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`relative grid aspect-[4/3.2] place-items-center overflow-hidden rounded-xl max-[560px]:aspect-square ${
        gelap
          ? "bg-[#1b1308] [background:radial-gradient(80%_90%_at_70%_100%,#d97706,transparent_70%),radial-gradient(60%_60%_at_10%_0%,#7c2d00,transparent_70%),#1b1308]"
          : "border border-[#e3cf86] bg-cl-slate"
      }`}
    >
      {children}
    </div>
  );
}

function Kartu({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <div className="w-[78%] rounded-lg bg-[#fffaf0] px-[18px] pb-3 pt-[18px] text-cl-ink shadow-[0_24px_60px_rgba(0,0,0,0.25)] max-[560px]:w-[92%]">
      <p className="mb-3 font-mono text-[10.5px] uppercase text-[#6b4f00]">{judul}</p>
      {children}
    </div>
  );
}

function Spek({ n, v, utama = false }: { n: string; v: string; utama?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-[#ead9a0] py-3">
      <span className="text-[13px]">{n}</span>
      <span className={`text-right text-[17px] font-light tabular-nums ${utama ? "text-cl-rust" : ""}`}>{v}</span>
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
