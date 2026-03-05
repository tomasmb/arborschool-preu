import { emailService, EMAIL_CONFIG } from "./service";
import type { EmailResult, EmailRecipient } from "./types";

export type MilestoneType =
  | "first_sprint"
  | "streak_5"
  | "streak_10"
  | "mastery_10"
  | "mastery_25"
  | "score_up_50";

export interface MilestoneData {
  type: MilestoneType;
  currentScore?: number | null;
}

const MILESTONES: Record<
  MilestoneType,
  { emoji: string; title: string; message: string }
> = {
  first_sprint: {
    emoji: "🎉",
    title: "Completaste tu primer sprint",
    message:
      "El primer paso siempre es el más importante. Ya comenzaste tu camino hacia la PAES.",
  },
  streak_5: {
    emoji: "🔥",
    title: "5 sesiones esta semana",
    message:
      "Consistencia es lo que separa a los que llegan de los que no. Vas increíble.",
  },
  streak_10: {
    emoji: "⚡",
    title: "10 sesiones completadas",
    message: "Estás al nivel de los mejores estudiantes de la plataforma.",
  },
  mastery_10: {
    emoji: "📚",
    title: "10 conceptos dominados",
    message:
      "Tu base de conocimiento crece. Cada concepto te acerca a tu meta.",
  },
  mastery_25: {
    emoji: "🧠",
    title: "25 conceptos dominados",
    message: "Un cuarto del contenido dominado. Sigues avanzando a paso firme.",
  },
  score_up_50: {
    emoji: "📈",
    title: "Subiste +50 puntos",
    message:
      "Tu esfuerzo se refleja en tu puntaje. La PAES cada vez más cerca.",
  },
};

function generateMilestoneHtml(
  recipient: EmailRecipient,
  data: MilestoneData
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const portalUrl = `${EMAIL_CONFIG.baseUrl}/portal`;
  const greeting = recipient.firstName ? `Hola ${recipient.firstName}` : "Hola";
  const m = MILESTONES[data.type];

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${m.title}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
      <p style="margin:0 0 12px 0;font-size:16px;color:#475569;">${greeting},</p>

      <div style="text-align:center;padding:20px 0;">
        <p style="margin:0;font-size:48px;">${m.emoji}</p>
        <h1 style="margin:12px 0 8px;font-size:24px;line-height:1.2;font-family:Georgia,serif;">
          ${m.title}
        </h1>
        <p style="margin:0;font-size:15px;color:#334155;max-width:400px;display:inline-block;">
          ${m.message}
        </p>
      </div>

      ${
        data.currentScore
          ? `
      <div style="background:linear-gradient(135deg,#0b3a5b 0%,#072a42 100%);border-radius:14px;padding:16px;text-align:center;margin:18px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.4px;">
          Puntaje actual
        </p>
        <p style="margin:0;font-size:36px;color:#ffffff;font-weight:700;">${data.currentScore}</p>
      </div>`
          : ""
      }

      <div style="text-align:center;margin:22px 0 6px 0;">
        <a
          href="${portalUrl}"
          style="display:inline-block;background:linear-gradient(135deg,#f5c542,#d4a030);color:#1a1d1e;text-decoration:none;font-size:15px;font-weight:700;padding:12px 24px;border-radius:999px;"
        >
          Ver mi progreso
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

function generateMilestoneText(
  recipient: EmailRecipient,
  data: MilestoneData
): string {
  const greeting = recipient.firstName ? `Hola ${recipient.firstName}` : "Hola";
  const m = MILESTONES[data.type];
  return [
    `${greeting},`,
    "",
    `${m.emoji} ${m.title}`,
    "",
    m.message,
    "",
    data.currentScore ? `Puntaje actual: ${data.currentScore}` : "",
    "",
    "Ver tu progreso: " + EMAIL_CONFIG.baseUrl + "/portal",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendMilestoneEmail(
  recipient: EmailRecipient,
  data: MilestoneData
): Promise<EmailResult> {
  const m = MILESTONES[data.type];
  return emailService.send({
    to: recipient.email,
    subject: `${m.emoji} ${m.title}`,
    html: generateMilestoneHtml(recipient, data),
    text: generateMilestoneText(recipient, data),
  });
}
