export const AUTOMATION_DEFAULTS = {
  /** Generate invoices for next month on day 1. */
  monthlyInvoiceDay: 1,
  /** Due date offset from invoice creation. */
  invoiceDueInDays: 27,
  /** Reminder lead time before due date. */
  remindBeforeDueDays: 5,
  /** Reminder after due date. */
  remindAfterDueDays: 3,
  /** Auto-close after resolved for X days. */
  autoCloseResolvedDays: 7,
  /** Escalate if open for X days. */
  escalateOpenDays: 3,
} as const;

