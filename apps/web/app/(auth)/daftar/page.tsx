"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// "editor" adalah nama peran clipper di database. Di UI disebut "Clipper".
type Peran = "creator" | "editor";

const PILIHAN: { nilai: Peran; label: string; ket: string }[] = [
  {
    nilai: "creator",
    label: "Pemilik video",
    ket: "Buka kampanye, tentukan budget, dan bayar per 1.000 views."
  },
  {
    nilai: "editor",
    label: "Clipper",
    ket: "Ambil kampanye, potong klip, posting di akunmu, dan dibayar per views."
  }
];

export default function DaftarPage() {
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [nama, setNama] = useState("");
  const [status, setStatus] = useState<"idle" | "sibuk" | "cek-email" | "gagal">(
    "idle"
  );
  const [pesan, setPesan] = useState("");
  const [peran, setPeran] = useState<Peran>("creator");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("peran") === "clipper") setPeran("editor");
  }, []);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sibuk");
    setPesan("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signUp({
      email,
      password: kataSandi,
      options: { data: { display_name: nama, role: peran } }
    });
    if (error) {
      setStatus("gagal");
      setPesan(error.message);
      return;
    }
    setStatus("cek-email");
  }

  if (status === "cek-email") {
    return (
      <section aria-labelledby="judul-cek" role="status">
        <h1 id="judul-cek" className="font-display text-3xl font-light">
          Cek email kamu
        </h1>
        <p className="mt-4 text-sm">
          Tautan verifikasi sudah kami kirim ke <span className="font-medium">{email}</span>.
          Klik tautannya, lalu masuk untuk mulai.
        </p>
        <a
          href="/masuk"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[7px] bg-cl-accent px-4 font-mono text-xs uppercase text-cl-accent-ink transition-transform hover:-translate-y-0.5 hover:bg-cl-accent-hi focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cl-ink"
        >
          Ke halaman masuk
        </a>
      </section>
    );
  }

  return (
    <section aria-labelledby="judul-daftar">
      <h1 id="judul-daftar" className="font-display text-3xl font-light">
        Buat akun
      </h1>
      <p className="mt-2 text-sm text-cl-ink-soft">
        Pilih peranmu dulu, lalu isi empat kolom di bawah. Verifikasi email wajib sebelum kamu bisa
        membuka kampanye atau melamar proyek.
      </p>
      <form onSubmit={kirim} className="mt-8 space-y-6">
        <fieldset>
          <legend className="text-sm font-medium">Kamu mendaftar sebagai</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {PILIHAN.map(({ nilai, label, ket }) => {
              const aktif = peran === nilai;
              return (
                <label
                  key={nilai}
                  className={`flex min-h-[44px] cursor-pointer gap-3 rounded-[7px] border-2 p-3 transition-transform hover:-translate-y-0.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cl-ink ${
                    aktif ? "border-cl-ink bg-cl-accent" : "border-cl-ink-soft bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="peran"
                    value={nilai}
                    checked={aktif}
                    onChange={() => setPeran(nilai)}
                    className="mt-1 h-4 w-4 accent-cl-ink"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-sm text-cl-ink">{ket}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="nama" className="block text-sm font-medium">
            Nama tampilan
          </label>
          <input
            id="nama"
            name="nama"
            autoComplete="nickname"
            required
            maxLength={60}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-md border border-cl-ink-soft bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cl-ink"
          />
          <p className="mt-1 text-xs text-cl-ink-soft">Nama ini tampil di kampanye dan profilmu.</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-md border border-cl-ink-soft bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cl-ink"
          />
          <p className="mt-1 text-xs text-cl-ink-soft">Dipakai untuk masuk dan verifikasi.</p>
        </div>

        <div>
          <label htmlFor="sandi" className="block text-sm font-medium">
            Kata sandi
          </label>
          <input
            id="sandi"
            name="sandi"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            aria-describedby="sandi-bantu"
            className="mt-1.5 min-h-[44px] w-full rounded-md border border-cl-ink-soft bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cl-ink"
          />
          <p id="sandi-bantu" className="mt-1 text-xs text-cl-ink-soft">Minimal 8 karakter.</p>
        </div>

        {status === "gagal" && (
          <p role="alert" className="rounded-md bg-cl-slate px-3 py-2 text-sm text-cl-rust">
            Gagal mendaftar. {pesan}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sibuk"}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[7px] bg-cl-accent px-4 font-mono text-xs uppercase text-cl-accent-ink transition-transform hover:-translate-y-0.5 hover:bg-cl-accent-hi focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cl-ink disabled:translate-y-0 disabled:opacity-60"
        >
          {status === "sibuk" ? "Mendaftarkan..." : "Buat akun"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        Sudah punya akun?{" "}
        <a href="/masuk" className="font-medium underline underline-offset-4">
          Masuk
        </a>
      </p>
    </section>
  );
}
