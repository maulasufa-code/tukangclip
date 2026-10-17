import { NavSitus } from "@/components/nav-situs";
import { Ungkap } from "@/components/ungkap";

const langkah = [
  {
    nama: "Unggah",
    isi: "Pilih berkas MP4 sampai 2 GB. Browser mengirimnya langsung ke penyimpanan, jadi videonya tidak mampir ke server web."
  },
  {
    nama: "Analisis",
    isi: "Worker memecah video jadi beberapa momen, menandai hook tiap momen, dan menyiapkan judul untuk YouTube dan TikTok."
  },
  {
    nama: "Sunting",
    isi: "Di Studio kamu geser titik mulai dan akhir, tempel efek di beat tertentu, lalu rapikan judul dan hashtag."
  },
  {
    nama: "Render",
    isi: "Versi yang kamu simpan masuk antrean render. Keluarannya klip vertikal yang siap kamu unggah."
  }
];

const jalurInstan = [
  "Analisis jalan di antrean, statusnya bisa kamu pantau di dasbor",
  "Video sumber tetap di penyimpananmu, begitu juga klip hasilnya",
  "Hasilnya masuk Studio, tiap momen masih bisa digeser dan diberi efek",
  "Biayanya 1 kredit untuk 1 video, dipotong dari saldo kreditmu"
];

const jalurOrganic = [
  "Budget dikunci sebagai escrow selama kampanye berjalan",
  "Editor melamar dari pasar, maksimal 3 proyek aktif per editor",
  "Hasil dikirim sebelum tenggat 72 jam sejak lamaran diterima",
  "Bayaran dihitung per 1.000 views, dengan batas per klip"
];

const momenContoh = [
  { nama: "momen 1", isi: "mulai, akhir, hook" },
  { nama: "momen 2", isi: "efek per beat" },
  { nama: "momen 3", isi: "judul dan hashtag" }
];

const kolomEditPlan = [
  { istilah: "mulai, akhir", arti: "titik potong tiap momen" },
  { istilah: "hook", arti: "kalimat pembuka klip" },
  { istilah: "efek per beat", arti: "efek yang ditempel di beat tertentu" },
  { istilah: "judul", arti: "versi YouTube dan TikTok, plus hashtag" },
  { istilah: "versi", arti: "tiap penyimpanan membuat versi baru" }
];

const jagaData = [
  {
    istilah: "Verifikasi dua langkah",
    arti: "Bisa kamu nyalakan dari halaman keamanan untuk akun yang memegang saldo kredit dan rekening pencairan."
  },
  {
    istilah: "Rekening pencairan",
    arti: "Nomor rekening disimpan terenkripsi di server. Mengganti rekening akan mereset status verifikasinya."
  },
  {
    istilah: "Pemisahan data",
    arti: "Setiap baris data dijaga row level security, jadi baris milik orang lain tidak bisa dibaca dari sisi klien."
  }
];

const sisiKreator = [
  "Unggah video panjang dan pantau antrean analisisnya",
  "Tulis brief kampanye, lalu kunci budgetnya di escrow",
  "Sambungkan akun supaya views klip terbaca dari akunmu sendiri",
  "Tutup kampanye saat hasilnya sudah kamu terima"
];

const sisiEditor = [
  "Cari proyek di pasar dan kirim lamaran",
  "Kerjakan potongannya di Studio",
  "Kirim hasil sebelum tenggat 72 jam",
  "Simpan rekening pencairan, dibayar per 1.000 views"
];

const statusRilis = [
  "Sudah jalan: daftar akun, verifikasi email, unggah berkas langsung ke penyimpanan, dan antrean job di dasbor.",
  "Menyusul: analisis dan render otomatis, plus API backend untuk pasar, kredit, dan studio.",
  "Menyusul: gerak uang nyata lewat Xendit. Dana kampanye sekarang masih dicatat sebagai escrow.",
  "Menyusul: penyambungan akun TikTok yang masih menunggu verifikasi dari pihak TikTok."
];

const tautanKaki = [
  { href: "/pasar", label: "Pasar proyek" },
  { href: "/kredit", label: "Kredit AI" },
  { href: "/akun", label: "Akun sosial" },
  { href: "/keamanan", label: "Keamanan" },
  { href: "/masuk", label: "Masuk" },
  { href: "/daftar", label: "Buat akun" }
];

export default function Home() {
  return (
    <div className="gelap min-h-screen bg-arang font-archivo text-teks">
      {/* Tanpa JS, isi section harus tetap terlihat. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html: ".ungkap{opacity:1 !important;transform:none !important}"
        }}
      />
      <NavSitus />

      <main id="isi">
        <section className="border-b border-garis" aria-labelledby="judul-utama">
          <div className="mx-auto max-w-6xl px-5 pb-14 pt-12 sm:pb-20 sm:pt-20">
            <h1
              id="judul-utama"
              className="max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-7xl"
            >
              Potong video panjang jadi klip vertikal yang siap tayang
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-teks-lembut sm:text-lg">
              Dua cara mengerjakannya. Biarkan analisis otomatis yang mencari
              momennya, atau buka kampanye dan biarkan editor yang memotong.
              Videonya tetap di penyimpananmu dan progresnya bisa kamu pantau.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/unggah"
                className="min-h-[44px] inline-flex items-center justify-center rounded-md bg-kuning px-5 text-sm font-semibold text-kuning-tinta transition-colors hover:bg-kuning-tekan"
              >
                Unggah video panjang
              </a>
              <a
                href="/pasar"
                className="min-h-[44px] inline-flex items-center justify-center rounded-md border border-garis-terang px-5 text-sm font-medium transition-colors hover:border-teks"
              >
                Lihat pasar proyek
              </a>
            </div>

            <dl className="mt-14 grid gap-x-6 gap-y-8 border-t border-garis pt-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm font-semibold text-teks-lembut">Berkas</dt>
                <dd className="mt-2 tabular-nums">
                  MP4 sampai 2 GB, dikirim langsung ke penyimpanan
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-teks-lembut">Durasi</dt>
                <dd className="mt-2 tabular-nums">
                  Sampai 30 menit per video
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-teks-lembut">
                  Jalur instan
                </dt>
                <dd className="mt-2 tabular-nums">1 kredit untuk 1 video</dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          id="dua-jalur"
          className="border-b border-garis"
          aria-labelledby="judul-jalur"
        >
          <div className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
            <Ungkap>
              <h2
                id="judul-jalur"
                className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Dua jalur untuk satu video panjang
              </h2>
              <p className="mt-4 max-w-2xl text-teks-lembut">
                Jalur instan mengandalkan analisis otomatis. Jalur organic
                memakai editor yang mengerjakan potongan lalu menayangkannya
                dari akunnya sendiri.
              </p>
            </Ungkap>

            <div className="mt-10 grid gap-5 md:grid-cols-12">
              <Ungkap kelas="md:col-span-7">
                <article className="rounded-lg border border-garis bg-permukaan p-6 sm:p-8 md:h-full">
                  <h3 className="text-2xl font-bold">Jalur instan</h3>
                  <p className="mt-3 max-w-xl leading-relaxed text-teks-lembut">
                    Cocok kalau kamu mau hasil cepat dan tidak ingin
                    mengatur orang. Mesin yang menentukan momen, kamu yang
                    menyetel sisanya.
                  </p>
                  <ul className="mt-7 space-y-3">
                    {jalurInstan.map((baris) => (
                      <li key={baris} className="flex gap-3 text-sm">
                        <Tanda redup />
                        <span>{baris}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/unggah"
                    className="mt-8 inline-flex min-h-[44px] items-center text-sm font-semibold text-kuning underline underline-offset-4"
                  >
                    Unggah dan mulai analisis
                  </a>
                </article>
              </Ungkap>

              <Ungkap jeda={120} kelas="md:col-span-5">
                <article className="rounded-lg border border-garis p-6 sm:p-8 md:h-full">
                  <h3 className="text-2xl font-bold">Jalur organic</h3>
                  <p className="mt-3 leading-relaxed text-teks-lembut">
                    Cocok kalau kamu ingin banyak potongan dari satu video dan
                    tidak masalah membayar per hasil.
                  </p>
                  <ul className="mt-7 space-y-3">
                    {jalurOrganic.map((baris) => (
                      <li key={baris} className="flex gap-3 text-sm">
                        <Tanda redup />
                        <span>{baris}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/kampanye/baru"
                    className="mt-8 inline-flex min-h-[44px] items-center text-sm font-semibold text-kuning underline underline-offset-4"
                  >
                    Tulis brief kampanye
                  </a>
                </article>
              </Ungkap>
            </div>
          </div>
        </section>

        <section
          id="cara-kerja"
          className="border-b border-garis"
          aria-labelledby="judul-cara"
        >
          <div className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
            <Ungkap>
              <h2
                id="judul-cara"
                className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Empat langkah dari video mentah sampai klip
              </h2>
            </Ungkap>

            <ol className="mt-12 grid gap-x-8 gap-y-10 border-t border-garis pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {langkah.map((l, i) => (
                <li key={l.nama}>
                  <Ungkap jeda={i * 90}>
                    <div className="flex items-center gap-2.5">
                      <Tanda />
                      <h3 className="text-lg font-bold">{l.nama}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-teks-lembut">
                      {l.isi}
                    </p>
                  </Ungkap>
                </li>
              ))}
            </ol>

            <p className="mt-10 max-w-3xl rounded-md bg-permukaan px-4 py-3 text-sm text-teks-lembut">
              Catatan status: unggah dan antrean job sudah jalan. Analisis dan
              render otomatis masih dalam pengerjaan.
            </p>
          </div>
        </section>

        <section
          id="studio"
          className="border-b border-garis"
          aria-labelledby="judul-studio"
        >
          <div className="mx-auto max-w-6xl px-5 py-14 sm:py-24">
            <Ungkap>
              <h2
                id="judul-studio"
                className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Hasil analisis bukan kotak hitam
              </h2>
              <p className="mt-4 max-w-2xl text-teks-lembut">
                Semua keputusan potongan terbuka di Studio. Kalau mesin salah
                baca momen, kamu tinggal geser.
              </p>
            </Ungkap>

            <div className="mt-10 grid gap-8 md:grid-cols-12">
              <Ungkap kelas="md:col-span-7">
                <figure>
                  <div className="rounded-lg border border-garis bg-permukaan p-4 sm:p-6">
                    <p className="text-xs font-semibold text-teks-lembut">
                      Beberapa momen dari satu video panjang
                    </p>
                    <ul className="mt-3 grid grid-cols-[38fr_31fr_31fr] gap-2">
                      {momenContoh.map((m) => (
                        <li
                          key={m.nama}
                          className="rounded-md border border-garis bg-arang px-3 py-2"
                        >
                          <p className="text-sm font-semibold">{m.nama}</p>
                          <p className="mt-1 hidden text-xs leading-relaxed text-teks-lembut sm:block">
                            {m.isi}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <figcaption className="mt-3 text-sm text-teks-lembut">
                    Bentuk edit plan: satu video panjang dipecah jadi beberapa
                    momen, dan tiap momen menyimpan titik potong, hook, dan
                    efeknya sendiri. Ini diagram, bukan tangkapan layar.
                  </figcaption>
                </figure>
              </Ungkap>

              <Ungkap jeda={120} kelas="md:col-span-5">
                <dl className="divide-y divide-garis">
                  {kolomEditPlan.map((k) => (
                    <div key={k.istilah} className="py-4 first:pt-0">
                      <dt className="font-semibold">{k.istilah}</dt>
                      <dd className="mt-1 text-sm text-teks-lembut">
                        {k.arti}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Ungkap>
            </div>
          </div>
        </section>

        <section
          id="peran"
          className="border-b border-garis"
          aria-labelledby="judul-peran"
        >
          <div className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
            <Ungkap>
              <h2
                id="judul-peran"
                className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Untuk yang punya videonya, dan yang memotongnya
              </h2>
            </Ungkap>

            <div className="mt-10 grid gap-y-10 sm:grid-cols-2 sm:gap-x-0">
              <Ungkap>
                <div className="sm:pr-10">
                  <div className="flex items-center gap-2.5">
                    <Tanda />
                    <h3 className="text-xl font-bold">Kreator</h3>
                  </div>
                  <ul className="mt-5 space-y-3 text-sm leading-relaxed">
                    {sisiKreator.map((baris) => (
                      <li key={baris}>{baris}</li>
                    ))}
                  </ul>
                </div>
              </Ungkap>

              <Ungkap jeda={120}>
                <div className="sm:border-l sm:border-garis sm:pl-10">
                  <div className="flex items-center gap-2.5">
                    <Tanda />
                    <h3 className="text-xl font-bold">Editor</h3>
                  </div>
                  <ul className="mt-5 space-y-3 text-sm leading-relaxed">
                    {sisiEditor.map((baris) => (
                      <li key={baris}>{baris}</li>
                    ))}
                  </ul>
                </div>
              </Ungkap>
            </div>
          </div>
        </section>

        <section
          id="keamanan"
          className="border-b border-garis"
          aria-labelledby="judul-aman"
        >
          <div className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
            <Ungkap>
              <h2
                id="judul-aman"
                className="text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Uang dan data
              </h2>
              <dl className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-3">
                {jagaData.map((j) => (
                  <div key={j.istilah} className="border-t border-garis pt-5">
                    <dt className="font-semibold">{j.istilah}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-teks-lembut">
                      {j.arti}
                    </dd>
                  </div>
                ))}
              </dl>
            </Ungkap>

            <Ungkap jeda={120}>
              <div className="mt-12 flex flex-col gap-6 rounded-lg bg-permukaan p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
                <div className="sm:max-w-md">
                  <div className="flex items-center gap-2.5">
                    <Tanda />
                    <h3 className="text-lg font-bold">
                      Views dari akunmu sendiri
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-teks-lembut">
                    Klip organic ditayangkan dari akun yang kamu sambungkan,
                    supaya angka views-nya datang dari sumber resmi, bukan
                    hitungan platform.
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-teks-lembut sm:max-w-xs sm:border-l sm:border-garis sm:pl-6">
                  Yang belum bisa: akun TikTok. Penyambungannya masih menunggu
                  verifikasi dari pihak TikTok.
                </p>
              </div>
            </Ungkap>
          </div>
        </section>

        <section className="border-b border-garis" aria-labelledby="judul-status">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <Ungkap>
              <h2 id="judul-status" className="text-xl font-bold">
                Status rilis
              </h2>
              <ul className="mt-6 grid gap-4 text-sm leading-relaxed text-teks-lembut sm:grid-cols-2">
                {statusRilis.map((baris) => (
                  <li key={baris} className="border-t border-garis pt-4">
                    {baris}
                  </li>
                ))}
              </ul>
            </Ungkap>
          </div>
        </section>

        <section aria-labelledby="judul-ajakan">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-28">
            <Ungkap>
              <h2
                id="judul-ajakan"
                className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Mulai dari satu video panjang
              </h2>
              <p className="mt-4 max-w-xl text-teks-lembut">
                Buat akun, verifikasi email, lalu unggah video pertamamu. Saldo
                kredit dipakai hanya saat kamu menjalankan jalur instan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/daftar"
                  className="min-h-[44px] inline-flex items-center justify-center rounded-md bg-kuning px-5 text-sm font-semibold text-kuning-tinta transition-colors hover:bg-kuning-tekan"
                >
                  Buat akun
                </a>
                <a
                  href="/masuk"
                  className="min-h-[44px] inline-flex items-center justify-center rounded-md border border-garis-terang px-5 text-sm font-medium transition-colors hover:border-teks"
                >
                  Masuk
                </a>
              </div>
            </Ungkap>
          </div>
        </section>
      </main>

      <footer className="border-t border-garis">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-extrabold tracking-tight">TukangClip</p>
            <p className="mt-1 text-sm text-teks-lembut">
              Potong video panjang jadi klip vertikal.
            </p>
          </div>
          <nav aria-label="Kaki halaman">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {tautanKaki.map((t) => (
                <li key={t.href}>
                  <a href={t.href} className="text-teks-lembut hover:text-teks">
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Dua bar dari mark TukangClip. Versi kuning menandai judul, versi redup menandai butir daftar. */
function Tanda({ redup = false }: { redup?: boolean }) {
  const warna = redup ? "bg-garis-terang" : "bg-kuning";
  return (
    <span aria-hidden="true" className="mt-2 flex shrink-0 flex-col gap-[3px]">
      <span className={`block h-[3px] w-4 rounded-full ${warna}`} />
      <span className={`block h-[3px] w-4 rounded-full ${warna}`} />
    </span>
  );
}
