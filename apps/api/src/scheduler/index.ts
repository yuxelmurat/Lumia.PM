import { Cron } from "croner";
import { checkDueDateReminders } from "./due-date-reminders";
import { processPaytrRenewals } from "./paytr-renewals";
import { checkProjectWebhookReminders } from "./project-webhook-reminders";
import { reconcileWorkspaceSeats } from "./seat-reconciliation";
import { checkTrialReminders } from "./trial-reminders";

const jobs: Cron[] = [];

export function initializeScheduler(): void {
  jobs.push(new Cron("*/5 * * * *", checkDueDateReminders));
  jobs.push(new Cron("*/5 * * * *", checkProjectWebhookReminders));
  jobs.push(new Cron("17 * * * *", reconcileWorkspaceSeats));
  jobs.push(new Cron("23 * * * *", checkTrialReminders));
  jobs.push(new Cron("37 * * * *", processPaytrRenewals));
  console.log(
    "⏰ Scheduler started (reminders every 5 minutes, seat reconciliation, trial reminders, and PayTR renewals hourly)",
  );
}

export function shutdownScheduler(): void {
  for (const job of jobs) {
    job.stop();
  }
  jobs.length = 0;
}
