import { MathProvider } from "@/lib/qti/MathRenderer";

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MathProvider>{children}</MathProvider>;
}
