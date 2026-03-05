/**
 * Email Service Module
 *
 * Centralized email functionality using Resend.
 * All email templates and sending logic lives here.
 */

export { sendConfirmationEmail } from "./confirmationEmail";
export { scheduleFollowupEmail } from "./followupEmail";
export { sendMilestoneEmail } from "./milestoneEmail";
export { emailService, isEmailConfigured } from "./service";
export { sendStreakReminderEmail } from "./streakReminderEmail";
export { sendWeeklySummaryEmail } from "./weeklySummaryEmail";
export type { EmailResult, ResultsSnapshot } from "./types";
export type { FollowupContext, ScheduleFollowupParams } from "./followupEmail";
export type { MilestoneData, MilestoneType } from "./milestoneEmail";
export type { StreakReminderData } from "./streakReminderEmail";
export type { WeeklySummaryData } from "./weeklySummaryEmail";
