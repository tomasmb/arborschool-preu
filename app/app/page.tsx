"use client";

import Image from "next/image";

/**
 * Browser frame component for displaying app mockups
 */
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-300 bg-white">
      {/* Browser chrome */}
      <div className="bg-gray-200 px-4 py-3 flex items-center gap-3 border-b border-gray-300">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
          <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-gray-300 rounded-lg px-4 py-1.5 text-xs text-gray-600 flex items-center gap-2 shadow-sm">
            <svg
              className="w-3 h-3 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            preu.arbor.school
          </div>
        </div>
        <div className="hidden sm:block sm:w-16"></div>
      </div>
      {/* Content */}
      <div className="bg-white">{children}</div>
    </div>
  );
}

/**
 * CTA Button component for diagnostic
 */
function DiagnosticCTA() {
  return (
    <div className="text-center">
      <button
        onClick={goToDiagnostic}
        className="btn-cta px-10 py-5 text-lg shadow-lg mb-4"
      >
        Comenzar Diagnóstico Gratis
        <svg
          className="w-5 h-5 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </button>
      <p className="text-cool-gray text-sm">
        16 preguntas · Resultados inmediatos · Guarda tu progreso
      </p>
    </div>
  );
}

/**
 * Navigate to diagnostic test
 */
function goToDiagnostic() {
  window.location.href = "/diagnostico";
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-arbor.svg"
                alt="Arbor School"
                width={36}
                height={36}
              />
              <span className="text-xl font-serif font-bold text-primary">
                Arbor PreU
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-flex text-sm font-medium text-success bg-success/10 px-3 py-1.5 rounded-full">
                ¡Disponible!
              </span>
              <button
                onClick={goToDiagnostic}
                className="btn-cta text-sm px-4 py-2"
              >
                Hacer Diagnóstico
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-off-white"></div>
        <div className="absolute top-20 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse-subtle"></span>
              Diagnóstico PAES M1 disponible
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-charcoal mb-8">
              Alcanza tu puntaje PAES
              <span className="block text-accent mt-2">
                dominando un concepto a la vez
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-cool-gray max-w-2xl mx-auto mb-12 leading-relaxed">
              No más horas perdidas. Te enseñamos exactamente lo que te falta y
              no avanzas hasta que lo domines.
            </p>

            <button
              onClick={goToDiagnostic}
              className="btn-cta text-lg px-10 py-5 shadow-lg"
            >
              Tomar el Diagnóstico Gratis
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            <p className="text-sm text-cool-gray mt-4">
              16 preguntas · 30 minutos · Resultados inmediatos
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-off-white relative">
        <div className="absolute inset-0 dot-pattern"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal mb-6">
              Así funciona
            </h2>
            <p className="text-xl text-cool-gray max-w-2xl mx-auto">
              Un método probado para maximizar tu puntaje en el menor tiempo
              posible
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative group">
              <div className="card p-8 h-full">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-charcoal mb-4">
                  Diagnóstico
                </h3>
                <p className="text-cool-gray text-lg leading-relaxed">
                  En minutos descubrimos qué conceptos ya dominas y cuáles te
                  faltan. Sin rodeos.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="card p-8 h-full">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-charcoal mb-4">
                  Plan Inteligente
                </h3>
                <p className="text-cool-gray text-lg leading-relaxed">
                  Tu plan prioriza lo que más impacta tu puntaje, ordenado para
                  que nunca te falten los conocimientos previos.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="card p-8 h-full">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-charcoal mb-4">
                  Aprende y Domina
                </h3>
                <p className="text-cool-gray text-lg leading-relaxed">
                  Lección corta, práctica adaptativa. Solo avanzas cuando
                  demuestras que lo dominaste.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mastery Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full sm:w-1/2 h-1/2 sm:h-full bg-gradient-to-l from-accent/10 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal mb-8">
                Dominio, <span className="text-accent">no horas</span>
              </h2>
              <p className="text-xl text-cool-gray mb-10 leading-relaxed">
                Avanzas cuando demuestras que aprendiste. La práctica empieza
                fácil y sube de nivel a medida que aciertas.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 items-start group">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                    <svg
                      className="w-5 h-5 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-charcoal text-lg mb-1">
                      Victorias rápidas
                    </h4>
                    <p className="text-cool-gray">
                      Priorizamos conceptos que estás cerca de dominar—puntos
                      fáciles que suben tu puntaje rápido.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-charcoal text-lg mb-1">
                      Sin huecos
                    </h4>
                    <p className="text-cool-gray">
                      Si te trabas, detectamos qué concepto previo te falta y lo
                      trabajamos primero.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start group">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0 group-hover:bg-success/20 transition-colors">
                    <svg
                      className="w-5 h-5 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-charcoal text-lg mb-1">
                      Repaso inteligente
                    </h4>
                    <p className="text-cool-gray">
                      Te recordamos practicar justo antes de que se te olvide.
                      Así el conocimiento se queda.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-primary/60 mb-4 text-center uppercase tracking-wide">
                Así verás tu progreso
              </p>
              <BrowserFrame>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif font-bold text-charcoal">
                      Tu Dashboard
                    </h3>
                    <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                      En vivo
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-off-white rounded-xl border border-gray-200 hover:border-success/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-success"></div>
                        <span className="font-medium text-charcoal">
                          Comprensión Lectora
                        </span>
                      </div>
                      <span className="text-lg font-bold text-success">
                        87%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-accent/10 rounded-xl border-2 border-accent shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-accent"></div>
                        <span className="font-medium text-charcoal">
                          Matemática M1
                        </span>
                      </div>
                      <span className="text-lg font-bold text-accent">92%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-off-white rounded-xl border border-gray-200 hover:border-cool-gray/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-cool-gray"></div>
                        <span className="font-medium text-charcoal">
                          Ciencias
                        </span>
                      </div>
                      <span className="text-lg font-bold text-cool-gray">
                        65%
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-cool-gray mb-1">
                          Puntaje proyectado
                        </p>
                        <p className="text-4xl font-bold text-charcoal">748</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-cool-gray mb-1">Tu meta</p>
                        <p className="text-2xl font-bold text-accent">780</p>
                      </div>
                    </div>
                  </div>
                </div>
              </BrowserFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Plan Section */}
      <section className="py-24 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal mb-6">
              Cada día sabes qué hacer
            </h2>
            <p className="text-xl text-cool-gray max-w-2xl mx-auto">
              Tu plan se actualiza después de cada sesión, siempre enfocado en
              maximizar tu puntaje
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-primary/60 mb-4 text-center uppercase tracking-wide">
              Así se verá tu plan diario
            </p>
            <BrowserFrame>
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-charcoal">
                      Hoy
                    </h3>
                    <p className="text-cool-gray">Martes 13 de enero</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-charcoal">
                      25
                      <span className="text-lg font-normal text-cool-gray ml-1">
                        min
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 bg-accent/10 rounded-xl border-2 border-accent hover:border-accent transition-colors group cursor-pointer shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-charcoal">
                          Victoria rápida
                        </p>
                        <span className="text-xs font-bold text-white bg-accent px-2 py-0.5 rounded-full">
                          +12 pts
                        </span>
                      </div>
                      <p className="text-charcoal/70">
                        Ecuaciones cuadráticas – 5 ejercicios
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-charcoal/60">
                      8 min
                    </span>
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-off-white rounded-xl border border-gray-200 hover:border-primary transition-colors group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-charcoal mb-1">
                        Nuevo concepto
                      </p>
                      <p className="text-charcoal/70">
                        Factorización – Lección + práctica
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-charcoal/60">
                      12 min
                    </span>
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-off-white rounded-xl border border-gray-200 hover:border-success transition-colors group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-charcoal mb-1">Repaso</p>
                      <p className="text-charcoal/70">
                        Comprensión de textos – No olvidar
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-charcoal/60">
                      5 min
                    </span>
                  </div>
                </div>
              </div>
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* Progress Tracking - Dark Section */}
      <section className="py-24 section-navy relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-5"></div>
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-8">
                Progreso que se siente
              </h2>
              <p className="text-xl text-white/80 mb-10 leading-relaxed">
                Cada concepto que dominas te acerca a tu meta. Sin estimaciones
                vagas—sabes exactamente dónde estás.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <span className="text-white/90">
                    Ve qué conceptos dominaste y cuáles te faltan
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <span className="text-white/90">
                    Puntaje proyectado actualizado cada sesión
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <span className="text-white/90">
                    Tiempo estimado para alcanzar tu meta
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-xl font-serif font-bold text-white mb-8">
                Tu progreso
              </h3>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/80">Conceptos dominados</span>
                  <span className="text-2xl font-bold text-accent">
                    24<span className="text-white/60 font-normal">/87</span>
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-accent to-accent-light rounded-full h-3 transition-all duration-1000"
                    style={{ width: "28%" }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">748</p>
                  <p className="text-sm text-white/60">Puntaje actual</p>
                </div>
                <div className="bg-accent/20 rounded-xl p-4 text-center border border-accent/30">
                  <p className="text-3xl font-bold text-accent">780</p>
                  <p className="text-sm text-white/60">Tu meta</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-white/60 text-sm mb-2">Con 30 min/día:</p>
                <p className="text-white text-lg">
                  Alcanzas tu meta en{" "}
                  <span className="font-bold text-accent">12 semanas</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] bg-accent/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse-subtle"></span>
            Disponible ahora
          </div>

          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal mb-6">
            Descubre tu nivel real
          </h2>
          <p className="text-xl text-cool-gray mb-10">
            En 30 minutos sabrás exactamente qué conceptos dominas y cuáles
            necesitas trabajar para alcanzar tu puntaje meta.
          </p>

          <div className="max-w-lg mx-auto">
            <DiagnosticCTA />
          </div>

          <p className="text-sm text-cool-gray mt-6">
            Tu diagnóstico se guarda automáticamente al final.
          </p>
        </div>
      </section>

      {/* Footer */}
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
                <span className="text-2xl font-serif font-bold">
                  Arbor PreU
                </span>
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
    </main>
  );
}
