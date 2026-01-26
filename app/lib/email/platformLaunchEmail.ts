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
 */
function generateLaunchHtml(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const continueUrl = `${EMAIL_CONFIG.baseUrl}/continuar?user=${encodeURIComponent(recipient.userId)}`;
  const name = recipient.firstName || "estudiante";

  // Route section HTML (only if route exists)
  const routeSection = results.topRoute
    ? `
    <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">
      🎯 Tu ruta: <strong>${results.topRoute.name}</strong>
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
  line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; 
  background-color: #ffffff;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 32px;">
    <img src="${EMAIL_CONFIG.baseUrl}/logo-arbor.png" alt="Arbor" 
      style="height: 32px; margin-bottom: 16px;" />
  </div>

  <!-- Main Content -->
  <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; 
    border: 1px solid #e5e7eb;">
    
    <h1 style="color: #1e293b; font-size: 24px; margin: 0 0 16px 0; text-align: center;">
      🎉 Tu ruta de aprendizaje está lista
    </h1>

    <p style="color: #64748b; font-size: 16px; margin: 0 0 24px 0;">
      Hola ${name},
    </p>

    <p style="color: #64748b; font-size: 16px; margin: 0 0 24px 0;">
      La plataforma está lista. Puedes continuar donde lo dejaste:
    </p>

    <!-- Score Summary -->
    <div style="background-color: #f8f7f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        📊 Tu puntaje estimado: <strong>${results.paesMin}-${results.paesMax}</strong>
      </p>
      ${routeSection}
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${continueUrl}" style="display: inline-block; background-color: #0f172a; 
        color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 32px; 
        border-radius: 8px; text-decoration: none;">
        Continuar mi ruta →
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0;">
      Este enlace es único para ti y te llevará directo a tu ruta personalizada.
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 32px; padding-top: 24px; 
    border-top: 1px solid #e5e7eb;">
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
 */
function generateLaunchText(
  recipient: EmailRecipient,
  results: ResultsSnapshot
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const continueUrl = `${EMAIL_CONFIG.baseUrl}/continuar?user=${encodeURIComponent(recipient.userId)}`;
  const name = recipient.firstName || "estudiante";

  let text = `
Tu ruta de aprendizaje está lista

Hola ${name},

La plataforma está lista. Puedes continuar donde lo dejaste:

📊 Tu puntaje estimado: ${results.paesMin}-${results.paesMax}
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
