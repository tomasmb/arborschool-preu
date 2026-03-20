import { PageShell } from "../components";

export default function ProgressLoading() {
  return (
    <PageShell title="Mi progreso" subtitle=" ">
      <div className="space-y-4 animate-pulse">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
