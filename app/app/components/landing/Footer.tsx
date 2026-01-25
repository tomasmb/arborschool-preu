import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-charcoal text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo-arbor.svg"
                alt="Arbor School"
                width={40}
                height={40}
                className="brightness-0 invert"
              />
              <span className="text-2xl font-serif font-bold">Arbor PreU</span>
            </div>
            <p className="text-white/60 max-w-sm">
              Preparación PAES basada en dominio. Aprende lo que te falta,
              demuestra que lo sabes, avanza.
            </p>
          </div>

          <div className="md:text-right">
            <p className="text-white/40 text-sm">
              © 2026 Arbor School. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
