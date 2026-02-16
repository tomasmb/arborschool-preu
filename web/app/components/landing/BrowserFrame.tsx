/**
 * Browser frame component for displaying app mockups
 */
export function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-300 bg-white">
      {/* Browser chrome */}
      <div className="bg-gray-200 px-4 py-3 flex items-center gap-3 border-b border-gray-300">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
          <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-gray-300 rounded-lg px-4 py-1.5 text-xs text-gray-600 flex items-center gap-2 shadow-sm">
            <svg
              className="w-3 h-3 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            preu.arbor.school
          </div>
        </div>
        <div className="hidden sm:block sm:w-16"></div>
      </div>
      {/* Content */}
      <div className="bg-white">{children}</div>
    </div>
  );
}
