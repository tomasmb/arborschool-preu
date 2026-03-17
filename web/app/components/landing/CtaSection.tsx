"use client";

/**
 * Demo Request section — inline form for school leads.
 * Submits via server action that emails contacto@arbor.school.
 */
import { useState, useTransition } from "react";
import { ScrollReveal } from "./ScrollReveal";
import { submitDemoRequest } from "@/app/actions/demoRequest";

const ROLE_OPTIONS = [
  "Director/a",
  "Coordinador/a Académico/a",
  "Profesor/a",
  "Otro",
] as const;

export function CtaSection() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitDemoRequest(form);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(
          result.error ?? "Error al enviar. Intenta de nuevo."
        );
      }
    });
  };

  return (
    <section
      id="demo"
      className="py-16 sm:py-24 bg-white relative overflow-hidden"
    >
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2
          w-[400px] h-[200px] sm:w-[600px] sm:h-[300px]
          lg:w-[800px] lg:h-[400px] bg-accent/10 rounded-full blur-3xl"
      />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-8 sm:mb-10">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-serif
              font-bold text-charcoal mb-4"
          >
            Agenda una demo para tu colegio
          </h2>
          <p className="text-lg sm:text-xl text-cool-gray">
            Te mostramos la plataforma con datos de ejemplo en
            20 minutos.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          {submitted ? (
            <SuccessMessage />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  name="name"
                  label="Nombre completo"
                  required
                />
                <Field
                  name="school"
                  label="Colegio o institución"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-charcoal mb-1.5"
                  >
                    Rol
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    className="w-full rounded-xl border border-gray-300
                      bg-white px-4 py-3 text-sm text-charcoal
                      focus:border-primary focus:ring-1 focus:ring-primary
                      outline-none transition-colors"
                  >
                    <option value="">Selecciona tu rol</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  name="email"
                  label="Email institucional"
                  type="email"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field name="phone" label="Teléfono (opcional)" />
                <div />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-charcoal mb-1.5"
                >
                  Mensaje (opcional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  className="w-full rounded-xl border border-gray-300
                    bg-white px-4 py-3 text-sm text-charcoal
                    focus:border-primary focus:ring-1 focus:ring-primary
                    outline-none transition-colors resize-none"
                  placeholder="¿Algo que debamos saber de antemano?"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center">
                  {error}
                </p>
              )}

              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-cta px-10 py-4 text-lg shadow-lg
                    disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? "Enviando..." : "Solicitar demo"}
                </button>
              </div>
            </form>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-charcoal mb-1.5"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-gray-300 bg-white
          px-4 py-3 text-sm text-charcoal
          focus:border-primary focus:ring-1 focus:ring-primary
          outline-none transition-colors"
      />
    </div>
  );
}

function SuccessMessage() {
  return (
    <div
      className="bg-emerald-50 border border-emerald-200
        rounded-2xl p-8 text-center"
    >
      <div
        className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100
          flex items-center justify-center"
      >
        <svg
          className="w-7 h-7 text-emerald-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="text-xl font-serif font-bold text-emerald-800 mb-2">
        Solicitud enviada
      </h3>
      <p className="text-emerald-700">
        Nos pondremos en contacto contigo dentro de las próximas
        24 horas hábiles.
      </p>
    </div>
  );
}
