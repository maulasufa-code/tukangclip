"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

async function call(path: string, method: string, body?: unknown) {
  const supabase = supabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${data.session?.access_token ?? ""}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`gagal (${res.status})`);
  return res.json();
}

export function LamarButton({ campaignId, mine }: { campaignId: string; mine: boolean }) {
  const router = useRouter();
  const [pesan, setPesan] = useState("");

  if (mine) return null;
  return (
    <div>
      <button
        onClick={() =>
          call(`/campaigns/${campaignId}/apply`, "POST")
            .then(() => router.refresh())
            .catch((e) => setPesan(e.message))
        }
        className="min-h-[44px] rounded-md bg-stone-900 px-5 py-2 text-sm text-white"
      >
        Lamar proyek ini
      </button>
      {pesan && <p role="alert" className="mt-1 text-sm text-red-800">{pesan}</p>}
    </div>
  );
}

export function PutusanButtons({ appId }: { appId: string }) {
  const router = useRouter();
  const putus = (accept: boolean) =>
    call(`/applications/${appId}/decision`, "POST", { accept }).then(() => router.refresh());
  return (
    <div className="flex gap-2">
      <button onClick={() => putus(true)} className="min-h-[44px] rounded-md bg-stone-900 px-4 text-sm text-white">
        Terima
      </button>
      <button onClick={() => putus(false)} className="min-h-[44px] rounded-md border px-4 text-sm">
        Tolak
      </button>
    </div>
  );
}

export function ReviewButtons({ subId }: { subId: string }) {
  const router = useRouter();
  const nilai = (approve: boolean) =>
    call(`/submissions/${subId}/review`, "POST", { approve }).then(() => router.refresh());
  return (
    <div className="flex gap-2">
      <button onClick={() => nilai(true)} className="min-h-[44px] rounded-md bg-stone-900 px-4 text-sm text-white">
        Setujui
      </button>
      <button onClick={() => nilai(false)} className="min-h-[44px] rounded-md border border-red-300 px-4 text-sm text-red-800">
        Tolak
      </button>
    </div>
  );
}

export function TandaiPosted({ subId }: { subId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        call(`/submissions/${subId}/posted`, "POST", { url, platform: "youtube" }).then(() =>
          router.refresh()
        );
      }}
    >
      <input
        aria-label="URL klip tayang"
        placeholder="https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="min-h-[44px] flex-1 rounded-md border border-stone-300 px-3"
      />
      <button className="min-h-[44px] rounded-md bg-stone-900 px-4 text-sm text-white">
        Tandai tayang
      </button>
    </form>
  );
}
