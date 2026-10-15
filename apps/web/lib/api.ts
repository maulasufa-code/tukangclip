import { supabaseServer } from "@/lib/supabase/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function apiGet(path: string) {
  const supabase = supabaseServer();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session || !API) return null;
  const res = await fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${session.access_token}` },
    cache: "no-store"
  });
  return res.ok ? res.json() : null;
}

export async function myRole(): Promise<string> {
  const supabase = supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return "";
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return (data?.role as string) ?? "creator";
}
