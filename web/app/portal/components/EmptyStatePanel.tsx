import Link from "next/link";

type EmptyStatePanelProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function EmptyStatePanel({
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStatePanelProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-4 text-center">
      {/* Bullseye icon */}
      <svg
        className="w-14 h-14 mx-auto text-amber-300"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
      <h2 className="text-xl font-serif font-semibold text-primary">{title}</h2>
      <p className="text-sm text-amber-900">{description}</p>
      <Link href={ctaHref} className="btn-primary text-sm inline-block">
        {ctaLabel}
      </Link>
    </section>
  );
}
