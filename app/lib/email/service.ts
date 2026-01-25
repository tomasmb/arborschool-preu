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
   */
  async send(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const resend = getResendClient();

    if (!resend) {
      console.log(`[Email] Skipping email to ${options.to} (not configured)`);
      return { success: false, error: "Email service not configured" };
    }

    try {
      const result = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        replyTo: EMAIL_CONFIG.replyTo,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.error) {
        console.error("[Email] Send failed:", result.error);
        return { success: false, error: result.error.message };
      }

      console.log(`[Email] Sent to ${options.to}, id: ${result.data?.id}`);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Email] Exception:", message);
      return { success: false, error: message };
    }
  },
};
