/**
 * Email Service Module
 *
 * Centralized email functionality using Resend.
 * All email templates and sending logic lives here.
 */

export { sendConfirmationEmail } from "./confirmationEmail";
export { sendPlatformLaunchEmail } from "./platformLaunchEmail";
export { emailService, isEmailConfigured } from "./service";
export type { EmailResult, ResultsSnapshot } from "./types";
