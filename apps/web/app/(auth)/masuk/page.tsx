"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function MasukPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [status, setStatus] = useState<"idle" | "sibuk" | "gagal">("idle");
  const [pesan, setPesan] = useState("");

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sibuk");
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: kataSandi
    });
    if (error) {
      setStatus("gagal");
      setPesan(
        error.message.toLowerCase().includes("invalid login")
          ? "Email atau kata sandi tidak cocok."
          : error.message
      );
      return;
    }
    // Hanya tujuan di dalam situs. Parameter lain diabaikan.
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dasbor");
    router.refresh();
  }

  return (
    <section aria-labelledby="judul-masuk">
      <h1 id="judul-masuk" className="font-display text-3xl font-light">
        Masuk
      </h1>
      <p className="mt-2 text-sm text-cl-ink-soft">
        Pakai email dan kata sandi yang kamu buat saat mendaftar.
      </p>
      <form onSubmit={kirim} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-md border border-cl-ink-soft bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cl-ink"
          />
        </div>
        <div>
          <label htmlFor="sandi" className="block text-sm font-medium">
            Kata sandi
          </label>
          <input
            id="sandi"
            type="password"
            autoComplete="current-password"
            required
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-md border border-cl-ink-soft bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cl-ink"
          />
        </div>
        {status === "gagal" && (
          <p role="alert" className="rounded-md bg-cl-slate px-3 py-2 text-sm text-cl-rust">
            Gagal masuk. {pesan}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "sibuk"}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[7px] bg-cl-accent px-4 font-mono text-xs uppercase text-cl-accent-ink transition-transform hover:-translate-y-0.5 hover:bg-cl-accent-hi focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cl-ink disabled:translate-y-0 disabled:opacity-60"
        >
          {status === "sibuk" ? "Memeriksa..." : "Masuk ke dasbor"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        Belum punya akun?{" "}
        <a href="/daftar" className="font-medium underline underline-offset-4">
          Buat akun
        </a>
      </p>
    </section>
  );
}
