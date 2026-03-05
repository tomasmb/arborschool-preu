import { MathProvider } from "@/lib/qti/MathRenderer";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MathProvider>{children}</MathProvider>;
}
