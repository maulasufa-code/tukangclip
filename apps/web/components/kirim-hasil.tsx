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
    <div className="mt-2">
      <label className="block min-h-[44px] cursor-pointer rounded-md border border-dashed border-stone-400 p-4 text-center text-sm">
        Pilih file hasil MP4
        <input
          type="file"
          accept="video/mp4"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void kirim(f);
          }}
        />
      </label>
      {fase === "kerja" && <p role="status" className="mt-1 text-sm">Mengunggah dan mengirim...</p>}
      {fase === "ok" && <p role="status" className="mt-1 text-sm">Terkirim untuk direview.</p>}
      {fase === "gagal" && <p role="alert" className="mt-1 text-sm text-red-800">{pesan}</p>}
    </div>
  );
}
