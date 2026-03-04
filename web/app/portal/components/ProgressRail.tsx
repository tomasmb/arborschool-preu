type ProgressRailProps = {
  current: number;
  total: number;
  label?: string;
};

export function ProgressRail({ current, total, label }: ProgressRailProps) {
  const safeTotal = Math.max(1, total);
  const boundedCurrent = Math.max(0, Math.min(current, safeTotal));
  const percentage = Math.round((boundedCurrent / safeTotal) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{label ?? "Progreso"}</span>
        <span>
          {boundedCurrent}/{safeTotal} ({percentage}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-valuenow={boundedCurrent}
          aria-label={label ?? "Progreso"}
        />
      </div>
    </div>
  );
}
