import { emailService, EMAIL_CONFIG } from "./service";
import type { EmailResult, EmailRecipient } from "./types";
import { buildEmailStartSprintUrl } from "./links";

export interface StreakReminderData {
  sessionsThisWeek: number;
  targetSessions: number;
  daysSinceLastSession: number;
}

function generateStreakReminderHtml(
  recipient: EmailRecipient,
  data: StreakReminderData
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const sprintUrl = buildEmailStartSprintUrl("followup");
  const greeting = recipient.firstName ? `Hola ${recipient.firstName}` : "Hola";
  const remaining = data.targetSessions - data.sessionsThisWeek;

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>No pierdas tu racha</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
      <p style="margin:0 0 12px 0;font-size:16px;color:#475569;">${greeting},</p>
      <h1 style="margin:0 0 14px 0;font-size:24px;line-height:1.2;font-family:Georgia,serif;">
        ${
          data.daysSinceLastSession >= 3
            ? "Te extrañamos"
            : "No pierdas tu ritmo"
        }
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;color:#334155;">
        Llevas ${data.sessionsThisWeek} sesión${data.sessionsThisWeek !== 1 ? "es" : ""} esta semana.
        ${remaining > 0 ? `Te faltan ${remaining} para completar tu misión.` : ""}
        Un sprint toma solo 10-15 minutos.
      </p>

      <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:14px;text-align:center;margin:0 0 18px 0;">
        <p style="margin:0;font-size:32px;">🔥</p>
        <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#92400e;">
          ${data.sessionsThisWeek} sesión${data.sessionsThisWeek !== 1 ? "es" : ""} esta semana
        </p>
      </div>

      <div style="text-align:center;margin:22px 0 6px 0;">
        <a
          href="${sprintUrl}"
          style="display:inline-block;background:linear-gradient(135deg,#f5c542,#d4a030);color:#1a1d1e;text-decoration:none;font-size:15px;font-weight:700;padding:12px 24px;border-radius:999px;"
        >
          Hacer un sprint rápido
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
</html>`;
}

function generateStreakReminderText(
  recipient: EmailRecipient,
  data: StreakReminderData
): string {
  const greeting = recipient.firstName ? `Hola ${recipient.firstName}` : "Hola";
  const remaining = data.targetSessions - data.sessionsThisWeek;
  return [
    `${greeting},`,
    "",
    `Llevas ${data.sessionsThisWeek} sesiones esta semana.`,
    remaining > 0
      ? `Te faltan ${remaining} para completar tu misión.`
      : "Completaste tu misión semanal.",
    "",
    "Un sprint toma solo 10-15 minutos.",
    "",
    "Hacer un sprint: " + EMAIL_CONFIG.baseUrl + "/portal/study",
  ].join("\n");
}

export async function sendStreakReminderEmail(
  recipient: EmailRecipient,
  data: StreakReminderData
): Promise<EmailResult> {
  return emailService.send({
    to: recipient.email,
    subject:
      data.daysSinceLastSession >= 3
        ? `Te extrañamos en Arbor PreU`
        : `No pierdas tu ritmo — ${data.sessionsThisWeek} sesiones esta semana`,
    html: generateStreakReminderHtml(recipient, data),
    text: generateStreakReminderText(recipient, data),
  });
}
