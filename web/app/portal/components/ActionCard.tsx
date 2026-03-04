import Link from "next/link";
import type { ReactNode } from "react";

type ActionCardProps = {
  title: string;
  description: string;
  metrics?: ReactNode;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  onPrimaryClick?: () => void;
};

export function ActionCard({
  title,
  description,
  metrics,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  onPrimaryClick,
}: ActionCardProps) {
  return (
    <article className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
          Siguiente mejor acción
        </p>
        <h2 className="text-xl font-serif font-semibold text-primary">
          {title}
        </h2>
        <p className="text-sm text-gray-700">{description}</p>
      </div>

      {metrics ? <div>{metrics}</div> : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          onClick={onPrimaryClick}
          className="btn-primary text-sm"
        >
          {primaryLabel}
        </Link>
        {secondaryLabel && secondaryHref ? (
          <Link href={secondaryHref} className="btn-ghost text-sm">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
