import type { ReactNode } from "react";

type HeroMetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "primary" | "success" | "warning";
  footer?: ReactNode;
};

function accentClasses(accent: NonNullable<HeroMetricCardProps["accent"]>) {
  if (accent === "success") {
    return "from-emerald-500/10 to-emerald-50 border-emerald-200";
  }
  if (accent === "warning") {
    return "from-amber-500/10 to-amber-50 border-amber-200";
  }
  return "from-primary/10 to-white border-primary/20";
}

export function HeroMetricCard({
  label,
  value,
  hint,
  accent = "primary",
  footer,
}: HeroMetricCardProps) {
  return (
    <article
      className={[
        "rounded-xl border p-4 bg-gradient-to-br",
        accentClasses(accent),
      ].join(" ")}
    >
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-2xl font-semibold text-primary mt-1">{value}</p>
      {hint ? <p className="text-xs text-gray-600 mt-2">{hint}</p> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </article>
  );
}
