/**
 * Shared loading skeleton for question-based views
 * (prereq scan, review session, atom study).
 */
export function QuestionSkeleton() {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border border-gray-200 bg-white
          p-5 animate-pulse"
      >
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>
      <div
        className="rounded-2xl border border-gray-200 bg-white
          p-5 animate-pulse space-y-4"
      >
        <div className="h-20 w-full bg-gray-100 rounded-lg" />
        <div className="space-y-2">
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
