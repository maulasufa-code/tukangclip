"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function KeluarButton({ className }: { className: string }) {
  const router = useRouter();

  async function keluar() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={keluar} className={className}>
      Keluar
    </button>
  );
}
