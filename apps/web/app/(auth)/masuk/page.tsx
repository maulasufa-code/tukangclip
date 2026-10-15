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
      setPesan(error.message);
      return;
    }
    router.push("/dasbor");
    router.refresh();
  }

  return (
    <section aria-labelledby="judul-masuk">
      <h1 id="judul-masuk" className="text-2xl font-bold">
        Masuk
      </h1>
      <form onSubmit={kirim} className="mt-6 space-y-4">
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
            className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3"
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
            className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3"
          />
        </div>
        {status === "gagal" && (
          <p role="alert" className="text-sm text-red-800">
            Gagal masuk: {pesan}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "sibuk"}
          className="min-h-[44px] w-full rounded-md bg-stone-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {status === "sibuk" ? "Memeriksa..." : "Masuk ke dasbor"}
        </button>
      </form>
    </section>
  );
}
