export default function Home() {
  return (
    <section aria-labelledby="judul">
      <h1 id="judul" className="text-3xl font-bold leading-tight">
        Potong video panjang jadi klip vertikal siap upload
      </h1>
      <p className="mt-3 text-base text-stone-700">
        Pilih jalur otomatis untuk hasil cepat, atau buka kampanye dan biarkan
        editor mengerjakan potonganmu. Kamu pegang kendali penuh atas file dan
        antrean.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href="/unggah"
          className="min-h-[44px] inline-flex items-center justify-center rounded-md bg-stone-900 px-5 py-3 text-sm font-medium text-white"
        >
          Unggah video panjang
        </a>
        <a
          href="/dasbor"
          className="min-h-[44px] inline-flex items-center justify-center rounded-md border border-stone-300 px-5 py-3 text-sm font-medium"
        >
          Lihat pekerjaan saya
        </a>
      </div>
      <h2 className="mt-10 text-lg font-semibold">Cara kerja singkat</h2>
      <ol className="mt-3 space-y-3 text-sm text-stone-700">
        <li>1. Daftar dan verifikasi email, lalu buka halaman unggah.</li>
        <li>2. Pilih file MP4 maksimal 2 GB dan durasi 30 menit.</li>
        <li>3. File terkirim langsung ke penyimpanan R2, lalu masuk antrean.</li>
      </ol>
    </section>
  );
}
