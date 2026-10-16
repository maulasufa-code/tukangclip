"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024 * 1024;

type Fase = "idle" | "minta-url" | "unggah" | "catat" | "selesai" | "gagal";

export function UploadDropzone() {
  const [fase, setFase] = useState<Fase>("idle");
  const [persen, setPersen] = useState(0);
  const [pesan, setPesan] = useState("");

  async function pilih(file: File) {
    setPesan("");
    if (file.size > MAX_BYTES) {
      setFase("gagal");
      setPesan("File lebih dari 2 GB. Perkecil dulu sebelum mengunggah.");
      return;
    }
    if (file.type !== "video/mp4") {
      setFase("gagal");
      setPesan("Format harus MP4. Format lain ditolak di MVP ini.");
      return;
    }
    try {
      setFase("minta-url");
      const supabaseAwal = supabaseBrowser();
      const { data: sesi } = await supabaseAwal.auth.getSession();
      const presign = await fetch("/api/r2/presign", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sesi.session?.access_token ?? ""}`
        },
        body: JSON.stringify({
          filename: file.name,
          bytes: file.size,
          mime: file.type
        })
      });
      if (!presign.ok) throw new Error("presign gagal");
      const { uploadUrl, r2Key, idempotencyKey } = await presign.json();

      setFase("unggah");
      await putDenganProgres(uploadUrl, file, file.type, setPersen);

      setFase("catat");
      const supabase = supabaseBrowser();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("sesi habis, masuk ulang");
      const { error } = await supabase.from("ai_jobs").insert({
        owner_id: user.id,
        source_r2_key: r2Key,
        source_bytes: file.size,
        source_mime: file.type,
        idempotency_key: idempotencyKey
      });
      if (error) throw error;

      setFase("selesai");
    } catch (e) {
      setFase("gagal");
      setPesan(e instanceof Error ? e.message : "Unggah gagal, coba lagi.");
    }
  }

  return (
    <div>
      <label
        htmlFor="berkas"
        className="block min-h-[44px] cursor-pointer rounded-md border border-dashed border-stone-400 p-6 text-center"
      >
        <span className="block font-medium">Pilih file MP4</span>
        <span className="mt-1 block text-sm text-stone-700">
          Klik untuk pilih dari perangkat. Maks 2 GB.
        </span>
      </label>
      <input
        id="berkas"
        type="file"
        accept="video/mp4"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pilih(f);
        }}
      />
      {fase === "unggah" && (
        <p role="status" className="mt-3 text-sm">
          Mengunggah... {persen}%
        </p>
      )}
      {fase === "minta-url" && (
        <p role="status" className="mt-3 text-sm">
          Menyiapkan tautan aman...
        </p>
      )}
      {fase === "catat" && (
        <p role="status" className="mt-3 text-sm">
          Mencatat ke antrean...
        </p>
      )}
      {fase === "selesai" && (
        <div role="status" className="mt-3 rounded-md border p-4 text-sm">
          Berhasil masuk antrean. Pantau di{" "}
          <a href="/dasbor" className="underline">
            dasbor
          </a>
          .
        </div>
      )}
      {fase === "gagal" && (
        <p role="alert" className="mt-3 text-sm text-red-800">
          {pesan}
        </p>
      )}
    </div>
  );
}

function putDenganProgres(
  url: string,
  file: File,
  mime: string,
  onPersen: (n: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mime);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onPersen(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`R2 menolak unggahan (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Jaringan gagal saat mengunggah"));
    xhr.send(file);
  });
}
