import { PortalSWRProvider } from "./swrConfig";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalSWRProvider>{children}</PortalSWRProvider>;
}
