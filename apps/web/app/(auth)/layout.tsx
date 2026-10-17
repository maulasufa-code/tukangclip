import { Kerangka } from "@/components/kerangka";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <Kerangka>{children}</Kerangka>;
}
