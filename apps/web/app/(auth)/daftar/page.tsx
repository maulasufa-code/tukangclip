"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function DaftarPage() {
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [nama, setNama] = useState("");
  const [status, setStatus] = useState<"idle" | "sibuk" | "cek-email" | "gagal">(
    "idle"
  );
  const [pesan, setPesan] = useState("");

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sibuk");
    setPesan("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signUp({
      email,
      password: kataSandi,
      options: { data: { display_name: nama } }
    });
    if (error) {
      setStatus("gagal");
      setPesan(error.message);
      return;
    }
    setStatus("cek-email");
  }

  return (
    <section aria-labelledby="judul-daftar">
      <h1 id="judul-daftar" className="text-2xl font-bold">
        Buat akun kreator
      </h1>
      <p className="mt-2 text-sm text-stone-700">
        Verifikasi email wajib sebelum kamu bisa mengunggah.
      </p>
      {status === "cek-email" ? (
        <div role="status" className="mt-6 rounded-md border p-4">
          <p className="font-medium">Cek kotak masuk email kamu.</p>
          <p className="mt-1 text-sm text-stone-700">
            Tautan verifikasi sudah terkirim ke {email}. Setelah klik tautan,
            kembali dan masuk.
          </p>
          <a href="/masuk" className="mt-3 inline-block underline">
            Lanjut ke halaman masuk
          </a>
        </div>
      ) : (
        <form onSubmit={kirim} className="mt-6 space-y-4">
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
              className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3"
            />
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
              className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3"
            />
          </div>
          <div>
            <label htmlFor="sandi" className="block text-sm font-medium">
              Kata sandi (min 8 karakter)
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
              className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3"
            />
          </div>
          {status === "gagal" && (
            <p role="alert" className="text-sm text-red-800">
              Gagal mendaftar: {pesan}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "sibuk"}
            className="min-h-[44px] w-full rounded-md bg-stone-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {status === "sibuk" ? "Mendaftarkan..." : "Buat akun"}
          </button>
        </form>
      )}
    </section>
  );
}
