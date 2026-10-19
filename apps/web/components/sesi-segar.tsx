"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Middleware Next 14 selalu berjalan di Edge, dan Vercel services tidak mendukung Edge.
// Karena itu sesi disegarkan dari browser: getSession memperbarui token dan menyimpannya ke cookie.
const JEDA_MS = 10 * 60 * 1000;

export function SesiSegar() {
  useEffect(() => {
    const supabase = supabaseBrowser();
    const segar = () => {
      void supabase.auth.getSession();
    };
    segar();
    const id = window.setInterval(segar, JEDA_MS);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
