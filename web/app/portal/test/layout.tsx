import { MathProvider } from "@/lib/qti/MathRenderer";

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MathProvider>{children}</MathProvider>;
}
