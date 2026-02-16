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

  // Calculate midpoint score (matches results page hero display)
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);

  // Personalized greeting if we have a name
  const greeting = recipient.firstName
    ? `¡Hola ${recipient.firstName}!`
    : "¡Hola!";

  // Route section HTML (only if route exists)
  const routeSection = results.topRoute
    ? `
    <div style="background: linear-gradient(135deg, #fef7ed 0%, #fffbf5 100%); 
      border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #fed7aa;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="display: inline-block; background-color: #f97316; color: white; 
          font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; 
          text-transform: uppercase; letter-spacing: 0.5px;">
          Tu ruta de mayor impacto
        </span>
      </div>
      <p style="color: #1a1d1e; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;
        font-family: Georgia, serif;">
        ${results.topRoute.name}
      </p>
      <p style="color: #059669; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">
        +${results.topRoute.pointsGain} puntos potenciales
      </p>
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        +${results.topRoute.questionsUnlocked} preguntas PAES que podrías desbloquear
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
  line-height: 1.6; color: #1a1d1e; max-width: 600px; margin: 0 auto; padding: 24px; 
  background-color: #fffbf5;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="${EMAIL_CONFIG.baseUrl}/logo-arbor.png" alt="Arbor" 
      style="height: 36px;" />
  </div>

  <!-- Completion Badge -->
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="display: inline-block; background-color: #dcfce7; color: #16a34a; 
      font-size: 13px; font-weight: 500; padding: 8px 16px; border-radius: 9999px;">
      ✓ Diagnóstico Completado
    </span>
  </div>

  <!-- Main Content -->
  <div style="background-color: #ffffff; border-radius: 20px; padding: 32px; 
    border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <p style="color: #64748b; font-size: 16px; margin: 0 0 8px 0; text-align: center;">
      ${greeting}
    </p>
    
    <h1 style="color: #1a1d1e; font-size: 26px; margin: 0 0 24px 0; text-align: center;
      font-family: Georgia, serif; font-weight: 700;">
      Tu diagnóstico está guardado
    </h1>

    <!-- Score Box - matches results page hero display -->
    <div style="background: linear-gradient(135deg, #0b3a5b 0%, #072a42 100%); 
      border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 24px;">
      <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase;
        letter-spacing: 0.5px;">
        Tu Puntaje PAES Estimado
      </p>
      <p style="color: #ffffff; font-size: 56px; font-weight: 700; margin: 0 0 8px 0;
        line-height: 1;">
        ${midScore}
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">
        Rango probable: ${results.paesMin}–${results.paesMax}
      </p>
    </div>

    ${routeSection}

    <!-- What's Next -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; 
      padding: 20px; margin: 24px 0;">
      <p style="color: #16a34a; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">
        ¿Qué sigue?
      </p>
      <p style="color: #15803d; font-size: 14px; margin: 0; line-height: 1.5;">
        Te avisamos cuando la plataforma esté lista para continuar con tu ruta personalizada.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 32px; padding-top: 24px;">
    <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0;">
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

  // Calculate midpoint score (matches results page hero display)
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);

  // Personalized greeting if we have a name
  const greeting = recipient.firstName
    ? `¡Hola ${recipient.firstName}!`
    : "¡Hola!";

  let text = `
✓ Diagnóstico Completado

${greeting}

Tu diagnóstico está guardado. Aquí está tu resumen:

📊 Tu Puntaje PAES Estimado: ${midScore}
   Rango probable: ${results.paesMin}–${results.paesMax}
`;

  if (results.topRoute) {
    text += `
🎯 Tu ruta de mayor impacto: ${results.topRoute.name}
   • +${results.topRoute.pointsGain} puntos potenciales
   • +${results.topRoute.questionsUnlocked} preguntas PAES que podrías desbloquear
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
