import { emailService, EMAIL_CONFIG } from "./service";
import type { EmailResult, ResultsSnapshot, EmailRecipient } from "./types";
import { buildEmailStartStudyUrl } from "./links";

function generateConfirmationHtml(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const startStudyUrl = buildEmailStartStudyUrl("confirmation");
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);
  const greeting = recipient.firstName ? `Hola ${recipient.firstName}` : "Hola";

  const routeSection = results.topRoute
    ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:18px 0;">
        <p style="margin:0 0 6px 0;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.4px;">
          Ruta priorizada
        </p>
        <p style="margin:0;font-size:16px;color:#0f172a;font-weight:700;">
          ${results.topRoute.name}
        </p>
        <p style="margin:6px 0 0 0;font-size:14px;color:#059669;">
          Impacto estimado: +${results.topRoute.pointsGain} puntos
        </p>
      </div>
    `
    : "";

  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tu diagnóstico está listo</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
      <p style="margin:0 0 12px 0;font-size:16px;color:#475569;">${greeting},</p>
      <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;font-family:Georgia,serif;">
        Tu diagnóstico está completo
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;color:#334155;">
        Tu siguiente paso recomendado ya está disponible dentro del portal.
      </p>

      <div style="background:linear-gradient(135deg,#0b3a5b 0%,#072a42 100%);border-radius:14px;padding:18px;text-align:center;">
        <p style="margin:0 0 8px 0;font-size:12px;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.4px;">
          Puntaje PAES estimado
        </p>
        <p style="margin:0;font-size:46px;line-height:1;color:#ffffff;font-weight:700;">${midScore}</p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#cbd5e1;">
          Rango: ${results.paesMin}–${results.paesMax}
        </p>
      </div>

      ${routeSection}

      <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:12px;padding:14px;">
        <p style="margin:0;font-size:14px;color:#166534;">
          Primera acción: <strong>Comenzar mini-clase de hoy</strong> (10-15 min).
        </p>
      </div>

      <div style="text-align:center;margin:22px 0 6px 0;">
        <a
          href="${startStudyUrl}"
          style="display:inline-block;background:#0b3a5b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;
            padding:12px 24px;border-radius:999px;"
        >
          Comenzar mini-clase de hoy
        </a>
      </div>
    </div>

    <div style="max-width:600px;margin:14px auto 0;text-align:center;color:#94a3b8;font-size:11px;">
      <p style="margin:0 0 8px 0;">El equipo de Arbor</p>
      <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">
        Darse de baja
      </a>
    </div>
  </body>
</html>
  `.trim();
}

function generateConfirmationText(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const startStudyUrl = buildEmailStartStudyUrl("confirmation");
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);
  const greeting = recipient.firstName ? `Hola ${recipient.firstName}` : "Hola";

  let text = `${greeting},

Tu diagnóstico está completo.

Puntaje PAES estimado: ${midScore}
Rango: ${results.paesMin}–${results.paesMax}
`;

  if (results.topRoute) {
    text += `

Ruta priorizada: ${results.topRoute.name}
Impacto estimado: +${results.topRoute.pointsGain} puntos
`;
  }

  text += `

Primera acción recomendada: Comenzar mini-clase de hoy (10-15 min)
${startStudyUrl}

---
Darse de baja: ${unsubscribeUrl}
`;

  return text.trim();
}

export async function sendConfirmationEmail(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): Promise<EmailResult> {
  const html = generateConfirmationHtml(recipient, results);
  const text = generateConfirmationText(recipient, results);

  return emailService.send({
    to: recipient.email,
    subject: "Tu diagnóstico está listo: comienza tu mini-clase de hoy",
    html,
    text,
  });
}
