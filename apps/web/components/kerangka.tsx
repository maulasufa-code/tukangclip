export function Kerangka({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-stone-200">
        <nav
          aria-label="Utama"
          className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3"
        >
          <a href="/" className="text-lg font-bold">
            TukangClip
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/masuk"
              className="min-h-[44px] inline-flex items-center rounded-md px-3 py-2 text-sm underline"
            >
              Masuk
            </a>
            <a
              href="/daftar"
              className="min-h-[44px] inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              Buat akun
            </a>
          </div>
        </nav>
      </header>
      <main id="isi" className="mx-auto max-w-3xl px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-stone-200">
        <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-stone-600">
          <a href="/unggah" className="underline">
            Unggah video
          </a>
          <span aria-hidden="true"> · </span>
          <a href="/dasbor" className="underline">
            Dasbor
          </a>
        </div>
      </footer>
    </>
  );
}
