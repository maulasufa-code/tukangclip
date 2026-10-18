"use client";

import { useState } from "react";
import { isian, label, tombolGaris, tombolPrimer } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export function SambungButtons() {
  const [pesan, setPesan] = useState("");

  async function sambung(platform: string) {
    if (!API) {
      setPesan("API backend belum dikonfigurasi.");
      return;
    }
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const res = await fetch(`${API}/oauth/${platform}/url`, {
      headers: { authorization: `Bearer ${data.session?.access_token ?? ""}` }
    });
    if (!res.ok) {
      setPesan(platform === "tiktok" ? "TikTok menunggu verifikasi docs API." : `Gagal (${res.status}).`);
      return;
    }
    const out = await res.json();
    window.location.href = out.url as string;
  }

  return (
    <div>
      <div className="flex gap-2">
        <button onClick={() => sambung("youtube")} className={tombolPrimer}>
          Sambung YouTube
        </button>
        <button onClick={() => sambung("tiktok")} className={tombolGaris}>
          Sambung TikTok
        </button>
      </div>
      {pesan && (
        <p role="alert" className="mt-2 text-sm text-stone-700">
          {pesan}
        </p>
      )}
    </div>
  );
}
