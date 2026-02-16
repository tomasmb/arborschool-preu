/**
 * Email Service Types
 */

/**
 * Results snapshot for email templates.
 * Mirrors the data shown on the results screen.
 */
export interface ResultsSnapshot {
  /** Minimum PAES score in range */
  paesMin: number;
  /** Maximum PAES score in range */
  paesMax: number;
  /** Performance tier for messaging */
  performanceTier: string;
  /** Top route info (optional - some tiers don't have routes) */
  topRoute?: {
    name: string;
    questionsUnlocked: number;
    pointsGain: number;
  };
}

/**
 * Result of an email send operation.
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * User data for email sending.
 */
export interface EmailRecipient {
  email: string;
  firstName?: string;
  userId: string;
}
