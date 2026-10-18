"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const MAX_BYTES = 2 * 1024 * 1024 * 1024;

export function KirimHasil({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [fase, setFase] = useState<"idle" | "kerja" | "gagal" | "ok">("idle");
  const [pesan, setPesan] = useState("");

  async function kirim(file: File) {
    if (!API) {
      setFase("gagal");
      setPesan("API backend belum dikonfigurasi.");
      return;
    }
    if (file.size > MAX_BYTES || file.type !== "video/mp4") {
      setFase("gagal");
      setPesan("Hanya MP4 sampai 2 GB.");
      return;
    }
    setFase("kerja");
    try {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const auth = `Bearer ${data.session?.access_token ?? ""}`;
      const pre = await fetch(`${API}/r2/presign`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: auth },
        body: JSON.stringify({ filename: file.name, bytes: file.size, mime: file.type, kind: "submission" })
      });
      if (!pre.ok) throw new Error("presign gagal");
      const { uploadUrl, r2Key } = await pre.json();
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error("unggah gagal");
      const sub = await fetch(`${API}/submissions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: auth },
        body: JSON.stringify({ applicationId, fileR2Key: r2Key })
      });
      if (!sub.ok) throw new Error(`kirim ditolak (${sub.status})`);
      setFase("ok");
      router.refresh();
    } catch (e) {
      setFase("gagal");
      setPesan(e instanceof Error ? e.message : "Gagal.");
    }
  }

  return (
    <div className="mt-4">
      <label className="flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-cl-ink bg-cl-slate p-4 text-center text-sm focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[#8a3a00]">
        <span className="font-medium">{fase === "kerja" ? "Mengunggah dan mengirim..." : "Pilih file klip (MP4)"}</span>
        <span className="text-cl-ink">Maksimal 2 GB. Kreator akan meninjau klipmu.</span>
        <input
          type="file"
          accept="video/mp4"
          disabled={fase === "kerja"}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void kirim(f);
            e.target.value = "";
          }}
        />
      </label>
      {fase === "ok" && <p role="status" className="mt-2 text-sm font-medium">Terkirim untuk direview.</p>}
      {fase === "gagal" && <p role="alert" className="mt-2 text-sm text-red-900">{pesan}</p>}
    </div>
  );
}
