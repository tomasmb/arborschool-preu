import { Metadata } from "next";
import { LegalPageLayout } from "../components/landing";

export const metadata: Metadata = {
  title: "Términos de Servicio | Arbor PreU",
  description:
    "Términos y condiciones de uso de la plataforma Arbor PreU.",
};

/** Terms of service page — /terminos */
export default function TerminosPage() {
  return (
    <LegalPageLayout
      title="Términos de Servicio"
      lastUpdated="11 de febrero de 2026"
    >
      {/* 1. Aceptación */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          1. Aceptación de los términos
        </h2>
        <p>
          Al acceder y utilizar la plataforma Arbor PreU (el
          &quot;Servicio&quot;), operada por Arbor Learning SpA
          (&quot;Arbor&quot;, &quot;nosotros&quot;), aceptas estos Términos de
          Servicio. Si no estás de acuerdo con alguna parte de estos términos,
          te pedimos que no utilices el Servicio.
        </p>
      </section>

      {/* 2. Descripción del servicio */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          2. Descripción del Servicio
        </h2>
        <p>
          Arbor PreU es una plataforma de preparación para la Prueba de Acceso a
          la Educación Superior (PAES) que ofrece diagnósticos basados en
          dominio. El Servicio permite a los usuarios realizar evaluaciones
          diagnósticas, recibir resultados personalizados y acceder a
          recomendaciones de estudio.
        </p>
      </section>

      {/* 3. Uso del servicio */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          3. Uso del Servicio
        </h2>
        <p className="mb-3">Al utilizar el Servicio, te comprometes a:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Proporcionar información veraz cuando se te solicite (por ejemplo,
            tu correo electrónico).
          </li>
          <li>
            Utilizar el Servicio únicamente con fines educativos y personales.
          </li>
          <li>
            No intentar acceder de forma no autorizada a los sistemas o datos de
            la plataforma.
          </li>
          <li>
            No reproducir, distribuir ni modificar el contenido del Servicio sin
            autorización.
          </li>
        </ul>
      </section>

      {/* 4. Propiedad intelectual */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          4. Propiedad intelectual
        </h2>
        <p>
          Todo el contenido de la plataforma — incluyendo textos, preguntas,
          diseños, logotipos, código y material gráfico — es propiedad de Arbor
          Learning SpA o de sus licenciantes y está protegido por las leyes de
          propiedad intelectual de Chile. Queda prohibida su reproducción total
          o parcial sin autorización previa y por escrito.
        </p>
      </section>

      {/* 5. Resultados y contenido educativo */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          5. Resultados y contenido educativo
        </h2>
        <p>
          Los resultados de diagnóstico y las recomendaciones proporcionadas por
          el Servicio son orientativos y tienen un fin exclusivamente educativo.
          No constituyen una garantía de rendimiento en la PAES ni en ningún
          otro examen. Arbor no se responsabiliza por decisiones tomadas con
          base en dichos resultados.
        </p>
      </section>

      {/* 6. Disponibilidad del servicio */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          6. Disponibilidad del Servicio
        </h2>
        <p>
          Nos esforzamos por mantener el Servicio disponible de forma continua,
          pero no garantizamos su disponibilidad ininterrumpida. Podemos
          suspender o modificar el Servicio temporal o permanentemente, con o sin
          previo aviso, por razones de mantenimiento, seguridad o mejoras.
        </p>
      </section>

      {/* 7. Limitación de responsabilidad */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          7. Limitación de responsabilidad
        </h2>
        <p>
          En la máxima medida permitida por la ley, Arbor Learning SpA no será
          responsable de daños directos, indirectos, incidentales o
          consecuenciales derivados del uso o la imposibilidad de uso del
          Servicio. El Servicio se proporciona &quot;tal cual&quot; y &quot;según
          disponibilidad&quot;.
        </p>
      </section>

      {/* 8. Privacidad */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">8. Privacidad</h2>
        <p>
          El tratamiento de tus datos personales se rige por nuestra{" "}
          <a
            href="/privacidad"
            className="text-primary underline hover:text-primary-light"
          >
            Política de Privacidad
          </a>
          , que forma parte integral de estos Términos.
        </p>
      </section>

      {/* 9. Modificaciones */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          9. Modificaciones a estos términos
        </h2>
        <p>
          Nos reservamos el derecho de actualizar estos Términos de Servicio en
          cualquier momento. La versión vigente estará siempre disponible en
          esta página con la fecha de última actualización. El uso continuado
          del Servicio tras cualquier modificación implica la aceptación de los
          nuevos términos.
        </p>
      </section>

      {/* 10. Legislación aplicable */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">
          10. Legislación aplicable
        </h2>
        <p>
          Estos términos se rigen por las leyes de la República de Chile.
          Cualquier controversia será sometida a la jurisdicción de los
          tribunales ordinarios de Santiago de Chile.
        </p>
      </section>

      {/* 11. Contacto */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-3">11. Contacto</h2>
        <p>
          Si tienes preguntas sobre estos Términos de Servicio, escríbenos a{" "}
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
