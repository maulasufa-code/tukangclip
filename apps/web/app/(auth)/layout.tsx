import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { ambilPengguna } from "@/lib/sesi";

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Sudah masuk: langsung ke dasbor, tidak perlu lewat halaman masuk lagi.
  if (await ambilPengguna()) redirect("/dasbor");

  return (
    <div className="min-h-screen bg-cl-paper text-cl-ink md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="bg-cl-night px-4 py-6 text-cl-paper md:flex md:flex-col md:px-12 md:py-12">
        <a
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2.5 rounded-md text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cl-accent"
        >
          <Logo className="h-[22px] w-auto text-cl-accent" />
          TukangClip
        </a>
        <div className="mt-8 md:mt-auto">
          <h2 className="font-display text-2xl font-light leading-tight md:text-4xl">
            Satu video panjang, banyak klip, dan semua dibayar per views.
          </h2>
          <ul className="mt-6 hidden space-y-4 text-base text-cl-muted md:block">
            <li>
              <span className="font-medium text-cl-paper">Pemilik video</span> membuka kampanye,
              menentukan budget, dan melihat klip tayang lewat dasbor.
            </li>
            <li>
              <span className="font-medium text-cl-paper">Clipper</span> mengambil kampanye, memotong
              klip, memposting di akunnya sendiri, dan dibayar sesuai views.
            </li>
          </ul>
        </div>
      </aside>
      <main id="isi" className="px-4 py-8 md:flex md:items-center md:px-12 md:py-12">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
