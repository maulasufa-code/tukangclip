import { Kerangka } from "@/components/kerangka";

export default function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <Kerangka>{children}</Kerangka>;
}
