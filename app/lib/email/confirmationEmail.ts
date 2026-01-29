/**
 * Confirmation Email Template
 *
 * Sent immediately after signup with results snapshot.
 * Matches the operational contract in conversion-optimization-implementation.md
 */

import { emailService, EMAIL_CONFIG } from "./service";
import type { EmailResult, ResultsSnapshot, EmailRecipient } from "./types";

/**
 * Generate the confirmation email HTML.
 * Matches the results page design system and score display.
 */
function generateConfirmationHtml(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const name = recipient.firstName || "estudiante";

  // Calculate midpoint score (matches results page hero display)
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);

  // Route section HTML (only if route exists)
  const routeSection = results.topRoute
    ? `
    <div style="background-color: #fffbf5; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">
        Tu ruta de mayor impacto:
      </p>
      <p style="color: #1a1d1e; font-size: 18px; font-weight: 600; margin: 0 0 4px 0;">
        ${results.topRoute.name}
      </p>
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        +${results.topRoute.questionsUnlocked} preguntas PAES · 
        +${results.topRoute.pointsGain} puntos potenciales
      </p>
    </div>
  `
    : "";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tus resultados PAES están guardados</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
  line-height: 1.6; color: #1a1d1e; max-width: 600px; margin: 0 auto; padding: 20px; 
  background-color: #fffbf5;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 32px;">
    <img src="${EMAIL_CONFIG.baseUrl}/logo-arbor.png" alt="Arbor" 
      style="height: 32px; margin-bottom: 16px;" />
  </div>

  <!-- Main Content -->
  <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; 
    border: 1px solid #e2e8f0;">
    
    <h1 style="color: #1a1d1e; font-size: 24px; margin: 0 0 16px 0; text-align: center;
      font-family: Georgia, serif;">
      ¡Listo! Tus resultados están guardados
    </h1>

    <p style="color: #64748b; font-size: 16px; margin: 0 0 24px 0; text-align: center;">
      Hola ${name}, tu diagnóstico está guardado. Aquí está tu resumen:
    </p>

    <!-- Score Box - matches results page hero display -->
    <div style="background: linear-gradient(135deg, #0b3a5b 0%, #072a42 100%); 
      border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0;">
        Tu Puntaje PAES Estimado
      </p>
      <p style="color: #ffffff; font-size: 48px; font-weight: 700; margin: 0 0 8px 0;">
        ${midScore}
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">
        Rango probable: ${results.paesMin}–${results.paesMax}
      </p>
    </div>

    ${routeSection}

    <!-- What's Next -->
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; 
      padding: 16px; margin: 24px 0;">
      <p style="color: #059669; font-size: 15px; margin: 0; font-weight: 500;">
        ¿Qué sigue?
      </p>
      <p style="color: #059669; font-size: 14px; margin: 8px 0 0 0;">
        Te avisamos cuando la plataforma esté lista para continuar con tu ruta personalizada.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 32px; padding-top: 24px; 
    border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
      El equipo de Arbor
    </p>
    <p style="color: #94a3b8; font-size: 11px; margin: 0;">
      <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">
        Darse de baja
      </a>
    </p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the email.
 * Matches the results page score display format.
 */
function generateConfirmationText(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const name = recipient.firstName || "estudiante";

  // Calculate midpoint score (matches results page hero display)
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);

  let text = `
¡Listo! Tus resultados están guardados

Hola ${name},

Tu diagnóstico está guardado. Aquí está tu resumen:

📊 Tu Puntaje PAES Estimado: ${midScore}
   Rango probable: ${results.paesMin}–${results.paesMax}
`;

  if (results.topRoute) {
    text += `
🎯 Tu ruta de mayor impacto: ${results.topRoute.name}
   • +${results.topRoute.questionsUnlocked} preguntas PAES que podrías desbloquear
   • +${results.topRoute.pointsGain} puntos potenciales
`;
  }

  text += `
¿Qué sigue?
Te avisamos cuando la plataforma esté lista para continuar con tu ruta personalizada.

—
El equipo de Arbor

---
Darse de baja: ${unsubscribeUrl}
`;

  return text.trim();
}

/**
 * Send confirmation email with results snapshot.
 *
 * @param recipient - User data (email, name, userId for unsubscribe)
 * @param results - Diagnostic results snapshot
 * @returns Email send result
 */
export async function sendConfirmationEmail(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): Promise<EmailResult> {
  const html = generateConfirmationHtml(recipient, results);
  const text = generateConfirmationText(recipient, results);

  return emailService.send({
    to: recipient.email,
    subject: "Tus resultados PAES están guardados",
    html,
    text,
  });
}
