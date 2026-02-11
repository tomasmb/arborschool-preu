import Link from "next/link";
import Image from "next/image";
import { Footer } from "./Footer";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/**
 * Shared layout for legal pages (privacy, terms, cookies).
 * Renders a simple header, the policy content, and the site footer.
 */
export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo-arbor.svg"
              alt="Arbor School"
              width={32}
              height={32}
            />
            <span className="font-serif font-bold text-lg leading-none text-charcoal group-hover:text-primary transition-colors">
              Arbor PreU
            </span>
          </Link>
        </div>
      </header>

      {/* Policy content */}
      <main className="flex-1 py-12 sm:py-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-2">
            {title}
          </h1>
          <p className="text-cool-gray text-sm mb-10">
            Última actualización: {lastUpdated}
          </p>

          {/* Prose styling for policy sections */}
          <div className="space-y-8 text-charcoal/90 leading-relaxed">
            {children}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
