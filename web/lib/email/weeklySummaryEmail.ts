import { emailService, EMAIL_CONFIG } from "./service";
import type { EmailResult, EmailRecipient } from "./types";
import { buildEmailStartSprintUrl } from "./links";

export interface WeeklySummaryData {
  completedSessions: number;
  targetSessions: number;
  correctAnswers: number;
  totalAnswers: number;
  currentScore: number | null;
  targetScore: number | null;
  topTopic: string | null;
}

function generateWeeklySummaryHtml(
  recipient: EmailRecipient,
  data: WeeklySummaryData
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const portalUrl = `${EMAIL_CONFIG.baseUrl}/portal`;
  const sprintUrl = buildEmailStartSprintUrl("followup");
  const greeting = recipient.firstName ? `Hola ${recipient.firstName}` : "Hola";
  const accuracy =
    data.totalAnswers > 0
      ? Math.round((data.correctAnswers / data.totalAnswers) * 100)
      : 0;
  const missionDone = data.completedSessions >= data.targetSessions;

  const scoreSection =
    data.currentScore !== null
      ? `
      <div style="background:linear-gradient(135deg,#0b3a5b 0%,#072a42 100%);border-radius:14px;padding:18px;text-align:center;margin:18px 0;">
        <p style="margin:0 0 6px 0;font-size:12px;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.4px;">
          Tu puntaje M1 actual
        </p>
        <p style="margin:0;font-size:42px;line-height:1;color:#ffffff;font-weight:700;">
          ${data.currentScore}
        </p>
        ${data.targetScore ? `<p style="margin:8px 0 0 0;font-size:14px;color:#cbd5e1;">Meta: ${data.targetScore}</p>` : ""}
      </div>`
      : "";

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tu resumen semanal</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
      <p style="margin:0 0 12px 0;font-size:16px;color:#475569;">${greeting},</p>
      <h1 style="margin:0 0 14px 0;font-size:24px;line-height:1.2;font-family:Georgia,serif;">
        Tu semana en Arbor PreU
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;color:#334155;">
        ${
          missionDone
            ? "Completaste tu misión semanal. Excelente."
            : `Completaste ${data.completedSessions} de ${data.targetSessions} sesiones esta semana.`
        }
      </p>

      ${scoreSection}

      <div style="display:flex;gap:12px;margin:18px 0;">
        <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;color:#166534;">${data.completedSessions}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#166534;">Sesiones</p>
        </div>
        <div style="flex:1;background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;color:#92400e;">${accuracy}%</p>
          <p style="margin:4px 0 0;font-size:12px;color:#92400e;">Precisión</p>
        </div>
      </div>

      ${
        data.topTopic
          ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin:0 0 18px 0;">
        <p style="margin:0;font-size:13px;color:#475569;">
          Tu área de mayor progreso: <strong style="color:#0f172a;">${data.topTopic}</strong>
        </p>
      </div>`
          : ""
      }

      <div style="text-align:center;margin:22px 0 6px 0;">
        <a
          href="${sprintUrl}"
          style="display:inline-block;background:linear-gradient(135deg,#f5c542,#d4a030);color:#1a1d1e;text-decoration:none;font-size:15px;font-weight:700;padding:12px 24px;border-radius:999px;"
        >
          Comenzar nueva semana
        </a>
      </div>

      <div style="text-align:center;margin:8px 0;">
        <a href="${portalUrl}" style="color:#0b3a5b;font-size:13px;text-decoration:underline;">
          Ver mi portal completo
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

function generateWeeklySummaryText(
  recipient: EmailRecipient,
  data: WeeklySummaryData
): string {
  const greeting = recipient.firstName ? `Hola ${recipient.firstName}` : "Hola";
  const lines = [
    `${greeting},`,
    "",
    "Tu semana en Arbor PreU:",
    `- Sesiones: ${data.completedSessions}/${data.targetSessions}`,
    `- Respuestas correctas: ${data.correctAnswers}/${data.totalAnswers}`,
  ];
  if (data.currentScore !== null) {
    lines.push(`- Puntaje M1: ${data.currentScore}`);
  }
  if (data.topTopic) {
    lines.push(`- Mayor progreso en: ${data.topTopic}`);
  }
  lines.push("", "Sigue preparándote en: " + EMAIL_CONFIG.baseUrl + "/portal");
  return lines.join("\n");
}

export async function sendWeeklySummaryEmail(
  recipient: EmailRecipient,
  data: WeeklySummaryData
): Promise<EmailResult> {
  return emailService.send({
    to: recipient.email,
    subject: `Tu semana en Arbor PreU: ${data.completedSessions} sesiones`,
    html: generateWeeklySummaryHtml(recipient, data),
    text: generateWeeklySummaryText(recipient, data),
  });
}
