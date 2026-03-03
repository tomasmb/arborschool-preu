import Link from "next/link";

export default function PortalGoalsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h1 className="text-2xl font-serif font-bold text-primary mb-2">
            Objetivos y Admisión
          </h1>
          <p className="text-gray-700 mb-4">
            Esta vista se construirá en la Fase 2 y Fase 3 con datos persistidos
            en DB y simulador de ponderaciones.
          </p>
          <Link
            href="/portal"
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Volver al portal
          </Link>
        </section>
      </div>
    </main>
  );
}
