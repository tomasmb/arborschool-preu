import { Metadata } from "next";
import { LegalPageLayout } from "../components/landing";

export const metadata: Metadata = {
  title: "Política de Privacidad | Arbor PreU",
  description:
    "Conoce cómo Arbor Learning SpA recopila, usa y protege tus datos personales.",
};

/** Privacy policy page — /privacidad */
export default function PrivacidadPage() {
  return (
    <LegalPageLayout
      title="Política de Privacidad"
      lastUpdated="11 de febrero de 2026"
    >
      {/* 1. Introducción */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">1. Introducción</h2>
        <p>
          En Arbor Learning SpA (&quot;Arbor&quot;, &quot;nosotros&quot;) nos
          comprometemos a proteger tu privacidad. Esta política explica qué
          datos personales recopilamos a través de nuestra plataforma Arbor PreU
          (el &quot;Servicio&quot;), cómo los usamos y cuáles son tus derechos
          conforme a la legislación chilena vigente, incluyendo la Ley 19.628
          sobre Protección de la Vida Privada y la Ley 21.719.
        </p>
      </section>

      {/* 2. Datos que recopilamos */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          2. Datos que recopilamos
        </h2>
        <p className="mb-3">
          Recopilamos únicamente los datos necesarios para entregar y mejorar el
          Servicio:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Correo electrónico:</strong> cuando solicitas recibir tus
            resultados por correo.
          </li>
          <li>
            <strong>Respuestas de diagnóstico:</strong> las respuestas que
            entregas durante el test diagnóstico PAES, asociadas a una sesión
            anónima.
          </li>
          <li>
            <strong>Datos de uso y analítica:</strong> información sobre cómo
            navegas e interactúas con la plataforma, recopilada mediante
            PostHog (consulta nuestra{" "}
            <a
              href="/cookies"
              className="text-primary underline hover:text-primary-light"
            >
              Política de Cookies
            </a>
            ).
          </li>
        </ul>
      </section>

      {/* 3. Finalidad del tratamiento */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          3. Finalidad del tratamiento
        </h2>
        <p className="mb-3">Usamos tus datos para:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Generar y enviarte tus resultados de diagnóstico.</li>
          <li>
            Mejorar el contenido, la experiencia de usuario y el rendimiento de
            la plataforma.
          </li>
          <li>
            Comunicarnos contigo sobre el Servicio (solo si proporcionaste tu
            correo).
          </li>
        </ul>
      </section>

      {/* 4. Base legal */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">4. Base legal</h2>
        <p>
          El tratamiento de tus datos se basa en tu consentimiento al utilizar
          el Servicio y proporcionar tu información voluntariamente, conforme al
          artículo 4 de la Ley 19.628.
        </p>
      </section>

      {/* 5. Almacenamiento y seguridad */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          5. Almacenamiento y seguridad
        </h2>
        <p>
          Tus datos se almacenan en servidores seguros con cifrado en tránsito
          (HTTPS/TLS). Aplicamos medidas técnicas y organizativas razonables
          para proteger tus datos contra acceso no autorizado, pérdida o
          alteración. Los datos se conservan mientras sean necesarios para la
          finalidad descrita o hasta que solicites su eliminación.
        </p>
      </section>

      {/* 6. Servicios de terceros */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          6. Servicios de terceros
        </h2>
        <p className="mb-3">Utilizamos los siguientes servicios de terceros:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>PostHog:</strong> analítica de producto para entender el uso
            de la plataforma. PostHog puede almacenar cookies en tu navegador
            (ver{" "}
            <a
              href="/cookies"
              className="text-primary underline hover:text-primary-light"
            >
              Política de Cookies
            </a>
            ).
          </li>
          <li>
            <strong>Vercel:</strong> alojamiento de la aplicación web.
          </li>
        </ul>
      </section>

      {/* 7. Tus derechos */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">7. Tus derechos</h2>
        <p className="mb-3">
          De acuerdo con la legislación chilena, tienes derecho a:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Acceso:</strong> solicitar una copia de los datos personales
            que tenemos sobre ti.
          </li>
          <li>
            <strong>Rectificación:</strong> pedir que corrijamos datos
            inexactos.
          </li>
          <li>
            <strong>Eliminación:</strong> solicitar la eliminación de tus datos
            personales.
          </li>
          <li>
            <strong>Oposición:</strong> oponerte al tratamiento de tus datos en
            determinadas circunstancias.
          </li>
        </ul>
        <p className="mt-3">
          Para ejercer cualquiera de estos derechos, escríbenos a{" "}
          <a
            href="mailto:contacto@arbor.school"
            className="text-primary underline hover:text-primary-light"
          >
            contacto@arbor.school
          </a>
          . Responderemos en un plazo máximo de 15 días hábiles.
        </p>
      </section>

      {/* 8. Cambios a esta política */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          8. Cambios a esta política
        </h2>
        <p>
          Podemos actualizar esta política ocasionalmente. Publicaremos la
          versión actualizada en esta página con la nueva fecha de
          actualización. Te recomendamos revisarla periódicamente.
        </p>
      </section>

      {/* 9. Contacto */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">9. Contacto</h2>
        <p>
          Si tienes preguntas sobre esta política o sobre el tratamiento de tus
          datos, contáctanos en{" "}
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
