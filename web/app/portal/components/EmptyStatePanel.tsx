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
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-3">
      <h2 className="text-xl font-serif font-semibold text-primary">{title}</h2>
      <p className="text-sm text-amber-900">{description}</p>
      <Link href={ctaHref} className="btn-primary text-sm">
        {ctaLabel}
      </Link>
    </section>
  );
}
