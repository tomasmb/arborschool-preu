import { Metadata } from "next";
import { LegalPageLayout } from "../components/landing";

export const metadata: Metadata = {
  title: "Política de Cookies | Arbor PreU",
  description:
    "Información sobre las cookies que utiliza la plataforma Arbor PreU.",
};

/** Cookie policy page — /cookies */
export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Política de Cookies"
      lastUpdated="11 de febrero de 2026"
    >
      {/* 1. ¿Qué son las cookies? */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          1. ¿Qué son las cookies?
        </h2>
        <p>
          Las cookies son pequeños archivos de texto que se almacenan en tu
          navegador cuando visitas un sitio web. Permiten que el sitio recuerde
          información sobre tu visita, como tus preferencias, para hacer tu
          experiencia más eficiente.
        </p>
      </section>

      {/* 2. Cookies que utilizamos */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          2. Cookies que utilizamos
        </h2>
        <p className="mb-4">
          Arbor PreU utiliza las siguientes categorías de cookies:
        </p>

        {/* Esenciales */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            a) Cookies esenciales
          </h3>
          <p className="mb-2">
            Son necesarias para el funcionamiento básico de la plataforma. Sin
            ellas, el sitio no puede funcionar correctamente.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-off-white">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Cookie</th>
                  <th className="text-left px-4 py-2 font-semibold">
                    Propósito
                  </th>
                  <th className="text-left px-4 py-2 font-semibold">
                    Duración
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-2">Sesión de diagnóstico</td>
                  <td className="px-4 py-2">
                    Mantener el estado de tu evaluación mientras la completas
                  </td>
                  <td className="px-4 py-2">Sesión</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Analítica */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            b) Cookies de analítica
          </h3>
          <p className="mb-2">
            Nos ayudan a entender cómo los usuarios interactúan con la
            plataforma para poder mejorarla.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-off-white">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Cookie</th>
                  <th className="text-left px-4 py-2 font-semibold">
                    Proveedor
                  </th>
                  <th className="text-left px-4 py-2 font-semibold">
                    Propósito
                  </th>
                  <th className="text-left px-4 py-2 font-semibold">
                    Duración
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-2">ph_*</td>
                  <td className="px-4 py-2">PostHog</td>
                  <td className="px-4 py-2">
                    Analítica de producto: páginas visitadas, interacciones y
                    rendimiento
                  </td>
                  <td className="px-4 py-2">1 año</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Cómo gestionar las cookies */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          3. Cómo gestionar las cookies
        </h2>
        <p className="mb-3">
          Puedes controlar y eliminar cookies a través de la configuración de tu
          navegador. A continuación, los enlaces a las instrucciones de los
          navegadores más utilizados:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary-light"
            >
              Google Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary-light"
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/es-cl/guide/safari/sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary-light"
            >
              Safari
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary-light"
            >
              Microsoft Edge
            </a>
          </li>
        </ul>
        <p className="mt-3">
          Ten en cuenta que deshabilitar ciertas cookies puede afectar la
          funcionalidad de la plataforma.
        </p>
      </section>

      {/* 4. Cambios a esta política */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          4. Cambios a esta política
        </h2>
        <p>
          Podemos actualizar esta Política de Cookies para reflejar cambios en
          las cookies que usamos o por motivos legales. Publicaremos la versión
          actualizada en esta página con la nueva fecha.
        </p>
      </section>

      {/* 5. Contacto */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">5. Contacto</h2>
        <p>
          Si tienes preguntas sobre nuestra Política de Cookies, contáctanos
          en{" "}
          <a
            href="mailto:contacto@arbor.school"
            className="text-primary underline hover:text-primary-light"
          >
            contacto@arbor.school
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
