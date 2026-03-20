import { PageShell } from "../components";

export default function TestLoading() {
  return (
    <PageShell title="Ensayo PAES" subtitle=" ">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse space-y-4">
        <div className="h-5 w-56 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
        <div className="mt-6 h-12 w-48 bg-gray-200 rounded-xl" />
      </div>
    </PageShell>
  );
}
