type ConfidenceBadgeProps = {
  level: "low" | "medium" | "high";
  score: number;
};

function getStyles(level: ConfidenceBadgeProps["level"]) {
  if (level === "high") {
    return {
      label: "Alta",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  }

  if (level === "medium") {
    return {
      label: "Media",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    };
  }

  return {
    label: "Baja",
    className: "bg-red-100 text-red-800 border-red-200",
  };
}

export function ConfidenceBadge({ level, score }: ConfidenceBadgeProps) {
  const styles = getStyles(level);

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        styles.className,
      ].join(" ")}
    >
      Confianza {styles.label} ({score}%)
    </span>
  );
}
