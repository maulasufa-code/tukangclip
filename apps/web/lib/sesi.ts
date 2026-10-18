import { supabaseServer } from "@/lib/supabase/server";

export type Peran = "creator" | "editor" | "admin";

/** Pengguna yang sedang masuk beserta perannya. Null kalau tamu. */
export async function ambilPengguna() {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profil } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    peran: (profil?.role ?? "creator") as Peran,
    nama: profil?.display_name ?? ""
  };
}
