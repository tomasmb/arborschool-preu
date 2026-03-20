import dynamic from "next/dynamic";

const FullTestClient = dynamic(
  () => import("./FullTestClient").then((mod) => mod.FullTestClient),
  { ssr: false }
);

export default function FullTestPage() {
  return <FullTestClient />;
}
