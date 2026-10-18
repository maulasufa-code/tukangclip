import { Kerangka } from "@/components/kerangka";
import { ambilPengguna } from "@/lib/sesi";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pengguna = await ambilPengguna();
  return <Kerangka pengguna={pengguna}>{children}</Kerangka>;
}
