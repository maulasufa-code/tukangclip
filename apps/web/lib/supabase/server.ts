import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(
          toSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          try {
            toSet.forEach(({ name, value, options }) => {
              store.set(name, value, options as never);
            });
          } catch {
            // Tanpa middleware, refresh token yang kedaluwarsa diabaikan di sini.
            // Klien browser menyegarkan sesi sendiri dan halaman login jadi fallback.
          }
        }
      }
    }
  );
}
