import Image from "next/image";
import Link from "next/link";

/** Site-wide footer with branding, contact, and legal links */
export function Footer() {
  return (
    <footer className="bg-charcoal text-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main grid: logo | contact | legal */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo-arbor.svg"
                alt="Arbor School"
                width={40}
                height={40}
                className="brightness-0 invert"
              />
              <span className="text-2xl font-serif font-bold leading-none">
                Arbor PreU
              </span>
            </div>
            <p className="text-white/60 max-w-sm">
              Preparación PAES basada en dominio. Aprende lo que te falta,
              demuestra que lo sabes, avanza.
            </p>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Contacto
            </h4>
            <a
              href="mailto:contacto@arbor.school"
              className="text-white/60 hover:text-white transition-colors"
            >
              contacto@arbor.school
            </a>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacidad"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="mt-10 pt-8 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            © 2026 Arbor Learning SpA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
