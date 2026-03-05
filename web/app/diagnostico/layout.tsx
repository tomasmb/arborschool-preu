import { MathProvider } from "@/lib/qti/MathRenderer";

export default function DiagnosticoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MathProvider>{children}</MathProvider>;
}
