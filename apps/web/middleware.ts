import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(
          toSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          toSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options as never)
          );
        }
      }
    }
  );
  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: ["/dasbor/:path*", "/unggah/:path*", "/studio/:path*", "/kredit", "/pasar", "/kampanye/:path*", "/kerjaanku", "/akun", "/keamanan", "/masuk", "/daftar"]
};
