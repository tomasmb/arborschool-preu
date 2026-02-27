/**
 * 24h Follow-up Email Template
 *
 * Sent ~24 hours after the student completes their diagnostic.
 * Goal: bring them back before the habit window closes.
 *
 * Design principles:
 * - Mobile-first, no heavy images
 * - Tier-specific copy that matches the results screen tone
 * - One clear CTA: "Volver a Arbor"
 * - Warm, human signature — not corporate
 */

import { emailService, EMAIL_CONFIG } from "./service";
import type { EmailResult, ResultsSnapshot, EmailRecipient } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface FollowupContext {
  /** Profiling data: PAES goal, date, in-preu status */
  paesGoal?: string | null;
  paesDate?: string | null;
}

// ============================================================================
// TIER COPY
// ============================================================================

interface TierCopy {
  headline: string;
  subtext: string;
  emoji: string;
}

/**
 * Motivating tier-specific copy — mirrors the results screen voice.
 * No shame, no hype. Honest and actionable.
 */
function getTierCopy(tier: string): TierCopy {
  switch (tier) {
    case "perfect":
      return {
        emoji: "🏆",
        headline: "Sacaste el máximo en el diagnóstico.",
        subtext:
          "Eso no pasa seguido. Ahora el desafío es mantenerlo el día de la PAES real — y para eso, la constancia importa más que el talento.",
      };
    case "nearPerfect":
      return {
        emoji: "🎯",
        headline: "Estás muy cerca del techo.",
        subtext:
          "1 o 2 conceptos específicos te separan del puntaje que quieres. Ya los identificamos — solo falta el trabajo.",
      };
    case "high":
      return {
        emoji: "📈",
        headline: "Tienes una base sólida.",
        subtext:
          "Tu diagnóstico mostró patrones claros. Con la ruta correcta, los próximos meses pueden mover bastante tu puntaje.",
      };
    case "average":
      return {
        emoji: "⚡",
        headline: "Estás en la mitad del camino.",
        subtext:
          "Y eso es exactamente el mejor momento para empezar. La diferencia entre donde estás y donde quieres llegar no es tan grande como parece.",
      };
    case "belowAverage":
      return {
        emoji: "🌱",
        headline: "Identificamos tu punto de partida.",
        subtext:
          "El diagnóstico breve no captura todo lo que sabes — pero sí nos dice por dónde empezar. Y eso vale mucho.",
      };
    case "veryLow":
    default:
      return {
        emoji: "🚀",
        headline: "Diste el primer paso.",
        subtext:
          "Muchos nunca lo hacen. El diagnóstico es solo el inicio — lo que viene después es donde ocurre el cambio real.",
      };
  }
}

// ============================================================================
// GAP MESSAGE
// ============================================================================

/**
 * Generates a personalized gap message if we have both score and goal.
 * Returns null if data is insufficient or gap is trivially small.
 */
function buildGapMessage(
  midScore: number,
  paesGoal: string | null | undefined
): string | null {
  if (!paesGoal) return null;

  let goalMin: number;
  let goalLabel: string;

  switch (paesGoal) {
    case "<600":
      goalMin = 500;
      goalLabel = "menos de 600";
      break;
    case "600-800":
      goalMin = 600;
      goalLabel = "entre 600 y 800";
      break;
    case "800+":
      goalMin = 800;
      goalLabel = "800 o más";
      break;
    default:
      return null;
  }

  const gap = goalMin - midScore;

  if (gap <= 0) {
    return `Ya alcanzaste tu meta de <strong>${goalLabel} puntos</strong> en el diagnóstico. El siguiente paso es consolidarlo.`;
  }

  if (gap > 300) {
    return `Tu meta es <strong>${goalLabel} puntos</strong>. La brecha existe, pero el tiempo también — y en Arbor vamos a recortarla.`;
  }

  return `Tu meta es <strong>${goalLabel} puntos</strong>. Te separan <strong>${gap} puntos</strong> — una distancia real, y alcanzable.`;
}

// ============================================================================
// HTML TEMPLATE
// ============================================================================

function generateFollowupHtml(
  recipient: EmailRecipient,
  results: ResultsSnapshot,
  context: FollowupContext
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const ctaUrl = EMAIL_CONFIG.baseUrl;

  const midScore = Math.round((results.paesMin + results.paesMax) / 2);
  const tierCopy = getTierCopy(results.performanceTier);
  const gapMessage = buildGapMessage(midScore, context.paesGoal);

  const greeting = recipient.firstName
    ? `Hola ${recipient.firstName} 👋`
    : "Hola 👋";

  // Top route section
  const routeSection = results.topRoute
    ? `
    <div style="background: linear-gradient(135deg, #fef7ed 0%, #fffbf5 100%);
      border-radius: 14px; padding: 18px 20px; margin: 20px 0;
      border: 1px solid #fed7aa;">
      <p style="color: #9a3412; font-size: 11px; font-weight: 700; margin: 0 0 6px 0;
        text-transform: uppercase; letter-spacing: 0.8px;">
        Tu ruta de mayor impacto
      </p>
      <p style="color: #1a1d1e; font-size: 18px; font-weight: 700; margin: 0 0 6px 0;
        font-family: Georgia, 'Times New Roman', serif;">
        ${results.topRoute.name}
      </p>
      <p style="color: #059669; font-size: 14px; font-weight: 600; margin: 0 0 2px 0;">
        +${results.topRoute.pointsGain} puntos potenciales
      </p>
      <p style="color: #64748b; font-size: 13px; margin: 0;">
        ${results.topRoute.questionsUnlocked} preguntas PAES que podrías dominar
      </p>
    </div>
  `
    : "";

  // Gap message section
  const gapSection = gapMessage
    ? `
    <p style="color: #374151; font-size: 15px; margin: 16px 0; line-height: 1.6;
      padding: 12px 16px; background: #f0f9ff; border-radius: 10px;
      border-left: 3px solid #0ea5e9;">
      ${gapMessage}
    </p>
  `
    : "";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Tu plan PAES está esperándote</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7f4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">

  <div style="max-width: 580px; margin: 0 auto; padding: 24px 16px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${EMAIL_CONFIG.baseUrl}/logo-arbor.png" alt="Arbor PreU"
        style="height: 32px;" />
    </div>

    <!-- Main card -->
    <div style="background: #ffffff; border-radius: 20px; padding: 32px 28px;
      border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

      <!-- Greeting -->
      <p style="font-size: 22px; font-weight: 700; color: #1a1d1e; margin: 0 0 4px 0;">
        ${greeting}
      </p>

      <!-- Hook -->
      <p style="font-size: 15px; color: #64748b; margin: 0 0 20px 0; line-height: 1.5;">
        Ayer completaste tu diagnóstico PAES. Aquí va un recordatorio de dónde estás y qué sigue.
      </p>

      <!-- Tier headline -->
      <div style="background: linear-gradient(135deg, #0b3a5b 0%, #072a42 100%);
        border-radius: 14px; padding: 22px 24px; margin-bottom: 20px;">
        <p style="font-size: 28px; margin: 0 0 4px 0; line-height: 1;">${tierCopy.emoji}</p>
        <p style="color: #ffffff; font-size: 19px; font-weight: 700; margin: 6px 0 8px 0;
          font-family: Georgia, 'Times New Roman', serif; line-height: 1.3;">
          ${tierCopy.headline}
        </p>
        <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5;">
          ${tierCopy.subtext}
        </p>
        <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #cbd5e1; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;
            letter-spacing: 0.5px;">
            Tu puntaje PAES estimado
          </p>
          <p style="color: #ffffff; font-size: 38px; font-weight: 700; margin: 0; line-height: 1;">
            ${midScore}
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">
            Rango: ${results.paesMin}–${results.paesMax}
          </p>
        </div>
      </div>

      ${gapSection}
      ${routeSection}

      <!-- 3 action steps -->
      <div style="margin: 24px 0;">
        <p style="font-size: 15px; font-weight: 700; color: #1a1d1e; margin: 0 0 14px 0;">
          3 cosas que puedes hacer hoy:
        </p>

        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <span style="font-size: 18px; margin-right: 12px; flex-shrink: 0;">📌</span>
          <div>
            <p style="font-size: 14px; font-weight: 600; color: #1a1d1e; margin: 0 0 2px 0;">
              Revisa tus respuestas del diagnóstico
            </p>
            <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.4;">
              Entra a Arbor y mira qué preguntas fallaste — muchas veces el error revela el patrón.
            </p>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <span style="font-size: 18px; margin-right: 12px; flex-shrink: 0;">📅</span>
          <div>
            <p style="font-size: 14px; font-weight: 600; color: #1a1d1e; margin: 0 0 2px 0;">
              Bloquea 20 min de estudio en tu calendario
            </p>
            <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.4;">
              No necesitas horas — necesitas consistencia. 20 minutos hoy valen más que 3 horas "algún día".
            </p>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start;">
          <span style="font-size: 18px; margin-right: 12px; flex-shrink: 0;">🎯</span>
          <div>
            <p style="font-size: 14px; font-weight: 600; color: #1a1d1e; margin: 0 0 2px 0;">
              Enfócate en un solo eje esta semana
            </p>
            <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.4;">
              El diagnóstico ya calculó tu ruta de mayor impacto. Empieza ahí, no en todo a la vez.
            </p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 28px 0 8px 0;">
        <a href="${ctaUrl}"
          style="display: inline-block; background: linear-gradient(135deg, #0b3a5b, #1e6091);
            color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none;
            padding: 14px 36px; border-radius: 50px;
            box-shadow: 0 4px 14px rgba(11, 58, 91, 0.3);">
          Volver a Arbor →
        </a>
        <p style="font-size: 12px; color: #94a3b8; margin: 10px 0 0 0;">
          Tu diagnóstico y plan están guardados — retomas donde lo dejaste.
        </p>
      </div>

    </div>

    <!-- Footer / signature -->
    <div style="padding: 24px 4px 16px; text-align: center;">
      <p style="font-size: 14px; color: #64748b; margin: 0 0 6px 0; line-height: 1.5;">
        — El equipo de Arbor 🌿
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 12px 0;">
        Estamos construyendo la mejor forma de preparar la PAES en Chile.<br>
        Gracias por ser parte del piloto.
      </p>
      <p style="font-size: 11px; color: #c0c7d0; margin: 0;">
        <a href="${unsubscribeUrl}"
          style="color: #c0c7d0; text-decoration: underline;">
          Darse de baja
        </a>
        &nbsp;·&nbsp;
        <a href="${ctaUrl}"
          style="color: #c0c7d0; text-decoration: underline;">
          preu.arbor.school
        </a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// PLAIN TEXT TEMPLATE
// ============================================================================

function generateFollowupText(
  recipient: EmailRecipient,
  results: ResultsSnapshot,
  context: FollowupContext
): string {
  const unsubscribeUrl = `${EMAIL_CONFIG.baseUrl}/api/unsubscribe?token=${encodeURIComponent(recipient.userId)}`;
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);
  const tierCopy = getTierCopy(results.performanceTier);
  const greeting = recipient.firstName ? `Hola ${recipient.firstName}` : "Hola";

  let text = `${greeting} 👋

Ayer completaste tu diagnóstico PAES. Aquí va un recordatorio de dónde estás.

${tierCopy.emoji} ${tierCopy.headline}
${tierCopy.subtext}

📊 Tu puntaje PAES estimado: ${midScore}
   Rango: ${results.paesMin}–${results.paesMax}
`;

  if (results.topRoute) {
    text += `
🎯 Tu ruta de mayor impacto: ${results.topRoute.name}
   +${results.topRoute.pointsGain} puntos potenciales
`;
  }

  if (context.paesGoal) {
    const gap = buildGapMessage(midScore, context.paesGoal);
    if (gap) {
      // Strip HTML tags for plain text
      text += `\n${gap.replace(/<[^>]+>/g, "")}\n`;
    }
  }

  text += `
3 cosas que puedes hacer hoy:

1. 📌 Revisa tus respuestas del diagnóstico
   Entra a Arbor y mira qué preguntas fallaste — muchas veces el error revela el patrón.

2. 📅 Bloquea 20 min de estudio en tu calendario
   No necesitas horas — necesitas consistencia. 20 minutos hoy valen más que 3 horas "algún día".

3. 🎯 Enfócate en un solo eje esta semana
   El diagnóstico ya calculó tu ruta de mayor impacto. Empieza ahí.

→ Volver a Arbor: ${EMAIL_CONFIG.baseUrl}

— El equipo de Arbor 🌿

---
Darse de baja: ${unsubscribeUrl}
`;

  return text.trim();
}

// ============================================================================
// PUBLIC API
// ============================================================================

export interface ScheduleFollowupParams {
  recipient: EmailRecipient;
  results: ResultsSnapshot;
  context: FollowupContext;
  /**
   * ISO 8601 datetime string for scheduled delivery.
   * If undefined, sends immediately.
   * Note: scheduledAt requires Resend Pro plan.
   */
  scheduledAt?: string;
}

/**
 * Schedule (or send immediately) the 24h follow-up email.
 *
 * The email reconnects students with their PAES plan and drives them
 * back to the platform before the habit window closes.
 *
 * @returns EmailResult — always resolves, never throws
 */
export async function scheduleFollowupEmail(
  params: ScheduleFollowupParams
): Promise<EmailResult> {
  const { recipient, results, context, scheduledAt } = params;

  const html = generateFollowupHtml(recipient, results, context);
  const text = generateFollowupText(recipient, results, context);

  // Subject varies based on whether we know their name
  const subject = recipient.firstName
    ? `Tu plan PAES está esperándote, ${recipient.firstName} 📚`
    : "Tu plan PAES está esperándote 📚";

  return emailService.send({
    to: recipient.email,
    subject,
    html,
    text,
    scheduledAt,
  });
}
