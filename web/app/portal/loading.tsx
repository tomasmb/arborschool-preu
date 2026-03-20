import { PageShell } from "./components";

export default function PortalLoading() {
  return (
    <PageShell title=" " subtitle=" ">
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-12 w-24 bg-gray-200 rounded" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="mt-4 h-3 w-full bg-gray-100 rounded-full" />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
          <div className="h-12 w-48 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </PageShell>
  );
}
