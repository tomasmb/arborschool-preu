/**
 * Email Service
 *
 * Wrapper around Resend for sending transactional emails.
 * Handles configuration and error handling centrally.
 */

import { Resend } from "resend";

// Singleton Resend instance
let resendInstance: Resend | null = null;

/**
 * Get the Resend client instance.
 * Returns null if RESEND_API_KEY is not configured.
 */
function getResendClient(): Resend | null {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[Email] RESEND_API_KEY not configured - emails will be skipped"
    );
    return null;
  }

  resendInstance = new Resend(apiKey);
  return resendInstance;
}

/**
 * Check if email service is configured and ready.
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Email configuration constants.
 */
export const EMAIL_CONFIG = {
  /** Sender email (must be verified in Resend) */
  from: "Arbor PreU <noreply@arbor.school>",
  /** Reply-to address for support */
  replyTo: "contacto@arbor.school",
  /** Base URL for links in emails */
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://preu.arbor.school",
} as const;

/**
 * Email service interface for sending emails.
 */
export const emailService = {
  /**
   * Send an email using Resend.
   * Returns success: false if email is not configured (graceful degradation).
   *
   * @param options.scheduledAt - ISO 8601 datetime for scheduled delivery.
   *   Requires Resend Pro plan. Falls back to immediate send if scheduling
   *   is not supported by the current plan.
   */
  async send(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    /** ISO 8601 datetime for scheduled delivery (Resend Pro required). */
    scheduledAt?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const resend = getResendClient();

    if (!resend) {
      console.log(`[Email] Skipping email to ${options.to} (not configured)`);
      return { success: false, error: "Email service not configured" };
    }

    const basePayload = {
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    try {
      // Try with scheduledAt if provided
      const sendPayload = options.scheduledAt
        ? { ...basePayload, scheduledAt: options.scheduledAt }
        : basePayload;

      let result = await resend.emails.send(sendPayload);

      // If scheduling failed due to plan limitation, retry without scheduledAt
      const isSchedulingError =
        result.error &&
        options.scheduledAt &&
        (result.error.message?.toLowerCase().includes("scheduled") ||
          result.error.message?.toLowerCase().includes("plan") ||
          (result.error.name as string) === "restricted_feature");
      if (isSchedulingError) {
        console.warn(
          "[Email] Scheduled send not supported on current plan — sending immediately"
        );
        result = await resend.emails.send(basePayload);
      }

      if (result.error) {
        console.error("[Email] Send failed:", result.error);
        return { success: false, error: result.error.message };
      }

      const scheduledNote = options.scheduledAt
        ? ` (scheduled: ${options.scheduledAt})`
        : "";
      console.log(
        `[Email] Sent to ${options.to}, id: ${result.data?.id}${scheduledNote}`
      );
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Email] Exception:", message);
      return { success: false, error: message };
    }
  },
};
