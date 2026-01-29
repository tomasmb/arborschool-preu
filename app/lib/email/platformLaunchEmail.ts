/**
 * Platform Launch Email Template
 *
 * Sent when the platform is ready for users to continue.
 * This is the second and final email in the cadence contract.
 */

import { emailService, EMAIL_CONFIG } from "./service";
import type { EmailResult, ResultsSnapshot, EmailRecipient } from "./types";

/**
 * Generate the platform launch email HTML.
 * Matches the design system and score display from results page.
 */
function generateLaunchHtml(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const continueUrl = `${EMAIL_CONFIG.baseUrl}/continuar?user=${encodeURIComponent(recipient.userId)}`;
  const name = recipient.firstName || "estudiante";

  // Calculate midpoint score (matches results page display)
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);

  // Route section HTML (only if route exists)
  const routeSection = results.topRoute
    ? `
    <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">
      🎯 Tu ruta: <strong style="color: #1a1d1e;">${results.topRoute.name}</strong>
    </p>
  `
    : "";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu ruta de aprendizaje está lista</title>
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
      🎉 Tu ruta de aprendizaje está lista
    </h1>

    <p style="color: #64748b; font-size: 16px; margin: 0 0 24px 0;">
      Hola ${name},
    </p>

    <p style="color: #64748b; font-size: 16px; margin: 0 0 24px 0;">
      La plataforma está lista. Puedes continuar donde lo dejaste:
    </p>

    <!-- Score Summary -->
    <div style="background-color: #fffbf5; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        📊 Tu puntaje estimado: <strong style="color: #0b3a5b; font-size: 18px;">${midScore}</strong>
        <span style="color: #94a3b8; font-size: 13px;"> (rango: ${results.paesMin}–${results.paesMax})</span>
      </p>
      ${routeSection}
    </div>

    <!-- CTA Button - uses accent gold like results page CTA -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${continueUrl}" style="display: inline-block; 
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #1a1d1e; font-size: 16px; font-weight: 600; padding: 14px 32px; 
        border-radius: 12px; text-decoration: none;">
        Continuar mi ruta →
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0;">
      Este enlace es único para ti y te llevará directo a tu ruta personalizada.
    </p>

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
function generateLaunchText(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const continueUrl = `${EMAIL_CONFIG.baseUrl}/continuar?user=${encodeURIComponent(recipient.userId)}`;
  const name = recipient.firstName || "estudiante";

  // Calculate midpoint score (matches results page display)
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);

  let text = `
Tu ruta de aprendizaje está lista

Hola ${name},

La plataforma está lista. Puedes continuar donde lo dejaste:

📊 Tu puntaje estimado: ${midScore} (rango: ${results.paesMin}–${results.paesMax})
`;

  if (results.topRoute) {
    text += `🎯 Tu ruta: ${results.topRoute.name}\n`;
  }

  text += `
Continuar mi ruta: ${continueUrl}

—
El equipo de Arbor

---
Darse de baja: ${unsubscribeUrl}
`;

  return text.trim();
}

/**
 * Send platform launch notification email.
 *
 * @param recipient - User data (email, name, userId for unsubscribe)
 * @param results - Diagnostic results snapshot
 * @returns Email send result
 */
export async function sendPlatformLaunchEmail(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): Promise<EmailResult> {
  const html = generateLaunchHtml(recipient, results);
  const text = generateLaunchText(recipient, results);

  return emailService.send({
    to: recipient.email,
    subject: "Tu ruta de aprendizaje está lista",
    html,
    text,
  });
}
