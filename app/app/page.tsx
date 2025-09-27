import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-arbor.svg"
                alt="Arbor School"
                width={40}
                height={40}
                className="text-primary"
              />
              <span className="text-xl font-serif font-bold text-primary">
                Arbor PreU
              </span>
            </div>
            <button className="btn-primary">Comenzar Ahora</button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-b from-white to-off-white py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight mb-6">
              Alcanza tu puntaje PAES
              <span className="block text-accent mt-2">
                con aprendizaje personalizado
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-charcoal/80 max-w-3xl mx-auto mb-10">
              Una plataforma de preparación para la PAES que se adapta a tu
              nivel, identifica tus fortalezas y debilidades, y crea un plan
              personalizado para que alcances el puntaje que necesitas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-cta text-lg px-8 py-4">
                Comenzar Diagnóstico Gratuito
              </button>
              <button className="btn-primary text-lg px-8 py-4">
                Conocer Más
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-16">
            ¿Cómo funciona Arbor PreU?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-serif font-bold mb-4">
                Diagnóstico Inicial
              </h3>
              <p className="text-charcoal/70">
                Toma un diagnóstico completo que identifica tu nivel actual en
                cada área de la PAES y mapea tus fortalezas y debilidades.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-serif font-bold mb-4">
                Plan Personalizado
              </h3>
              <p className="text-charcoal/70">
                Recibe un plan de estudio adaptado a tu disponibilidad de
                tiempo, fecha objetivo de la PAES, y las carreras que deseas
                estudiar.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-serif font-bold mb-4">
                Practica y Domina
              </h3>
              <p className="text-charcoal/70">
                Trabaja en ejercicios específicos que maximizan tu aprendizaje,
                priorizando victorias rápidas y cerrando las brechas
                fundamentales.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-6">
                Enfocado en dominio, no en horas
              </h2>
              <p className="text-lg text-charcoal/80 mb-6">
                Arbor PreU utiliza un sistema basado en grafos de conocimiento
                que mapea todas las habilidades necesarias para la PAES.
                Alcanzas el dominio cuando logras más del 90% de precisión en
                cada habilidad.
              </p>
              <p className="text-lg text-charcoal/80 mb-6">
                Nuestro sistema identifica automáticamente:
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-accent text-xl">✓</span>
                  <span className="text-charcoal/70">
                    <strong className="text-charcoal">
                      Victorias rápidas:
                    </strong>{" "}
                    habilidades que estás cerca de dominar
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent text-xl">✓</span>
                  <span className="text-charcoal/70">
                    <strong className="text-charcoal">
                      Prerequisitos bloqueadores:
                    </strong>{" "}
                    conceptos fundamentales que necesitas primero
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent text-xl">✓</span>
                  <span className="text-charcoal/70">
                    <strong className="text-charcoal">Repaso espaciado:</strong>{" "}
                    revisión inteligente para evitar olvidar lo aprendido
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-md">
                  <span className="font-medium">Comprensión Lectora</span>
                  <span className="text-accent font-bold">87%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-accent/10 rounded-md">
                  <span className="font-medium">Matemática M1</span>
                  <span className="text-accent font-bold">92%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-md">
                  <span className="font-medium">Ciencias</span>
                  <span className="text-cool-gray font-bold">65%</span>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-charcoal/60">
                      Puntaje proyectado
                    </span>
                    <span className="text-2xl font-bold text-primary">748</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal/60">
                      Meta para Ingeniería
                    </span>
                    <span className="text-lg font-medium text-charcoal">
                      780
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-16">
            Tu plan diario personalizado
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-off-white rounded-lg p-8 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif font-bold">Hoy</h3>
                <span className="text-charcoal/70">~25 minutos</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white rounded-md shadow-sm">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <span className="font-bold text-accent">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Victoria rápida</p>
                    <p className="text-sm text-charcoal/60">
                      Ecuaciones cuadráticas - 5 ejercicios
                    </p>
                  </div>
                  <span className="text-sm text-charcoal/60">8 min</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-md shadow-sm">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">📚</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Prerequisito</p>
                    <p className="text-sm text-charcoal/60">
                      Factorización - Mini lección + práctica
                    </p>
                  </div>
                  <span className="text-sm text-charcoal/60">12 min</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-md shadow-sm">
                  <div className="w-10 h-10 bg-cool-gray/20 rounded-full flex items-center justify-center">
                    <span className="font-bold text-cool-gray">🔄</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Repaso</p>
                    <p className="text-sm text-charcoal/60">
                      Comprensión de textos argumentativos
                    </p>
                  </div>
                  <span className="text-sm text-charcoal/60">5 min</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <button className="btn-cta text-lg px-8 py-4">
                Comenzar Plan de Hoy
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary to-primary/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-6 text-white">
                Sigue tu progreso en tiempo real
              </h2>
              <p className="text-lg text-white mb-6">
                Ve cómo cada sesión de práctica te acerca a tu meta. Nuestro
                sistema actualiza tu puntaje proyectado y te muestra exactamente
                cuántos puntos puedes ganar enfocándote en las áreas correctas.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-accent text-xl font-bold">→</span>
                  <span className="text-white">
                    Mapa de calor de tu dominio de habilidades
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent text-xl font-bold">→</span>
                  <span className="text-white">
                    Proyección de puntaje basada en simulaciones reales
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent text-xl font-bold">→</span>
                  <span className="text-white">
                    Recomendaciones de las 3 áreas con mayor impacto en tu
                    puntaje
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-lg p-8 border border-white/30">
              <h3 className="text-xl font-serif font-bold mb-6 text-white">
                Tus próximos pasos
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white">Habilidades dominadas</span>
                  <span className="text-2xl font-bold text-accent">24/87</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-accent rounded-full h-2"
                    style={{ width: "28%" }}
                  ></div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/30">
                  <p className="text-sm text-white mb-2">
                    Si practicas 30 min/día:
                  </p>
                  <p className="text-lg text-white">
                    Alcanzarás tu meta de{" "}
                    <span className="font-bold text-accent">780 puntos</span> en{" "}
                    <span className="font-bold">12 semanas</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-6">
            Contenido alineado 100% con la PAES
          </h2>
          <p className="text-lg text-charcoal/80 max-w-3xl mx-auto mb-12">
            Trabajamos con Carez & Córdova para traerte preguntas, soluciones
            detalladas, guías y clases alineadas con el temario oficial de la
            PAES. Cada pregunta está etiquetada a nuestro grafo de conocimiento
            para asegurar que practiques exactamente lo que necesitas.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-3xl font-bold text-primary mb-2">1000+</p>
              <p className="text-charcoal/70">Preguntas de práctica</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-3xl font-bold text-primary mb-2">87</p>
              <p className="text-charcoal/70">Habilidades mapeadas</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-3xl font-bold text-primary mb-2">90%</p>
              <p className="text-charcoal/70">Umbral de dominio</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-3xl font-bold text-primary mb-2">100%</p>
              <p className="text-charcoal/70">Alineado con PAES</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-6">
            Comienza tu preparación hoy
          </h2>
          <p className="text-lg text-charcoal/80 mb-10">
            Únete a los estudiantes que están alcanzando sus metas con Arbor
            PreU. Toma el diagnóstico gratuito y descubre tu plan personalizado.
          </p>
          <button className="btn-cta text-lg px-10 py-4">
            Comenzar Diagnóstico Gratuito
          </button>
        </div>
      </section>

      <footer className="bg-charcoal text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-arbor.svg"
                alt="Arbor School"
                width={32}
                height={32}
                className="brightness-0 invert"
              />
              <span className="text-lg font-serif font-bold">Arbor PreU</span>
            </div>
            <div className="text-cool-gray text-sm">
              © 2025 Arbor School. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
