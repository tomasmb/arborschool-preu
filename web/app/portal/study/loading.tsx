import { PageShell } from "../components";

export default function StudyLoading() {
  return (
    <PageShell title="Tu mini-clase" subtitle=" ">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
