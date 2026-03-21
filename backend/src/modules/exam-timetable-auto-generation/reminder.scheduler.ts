import { db } from "../../config/db.js";
import { ExamTimetableAutoGenerationService } from "./services/exam-timetable-auto-generation.service.js";

const service = new ExamTimetableAutoGenerationService();

export function startReminderScheduler(): void {
  const enabled = process.env.ENABLE_REMINDER_SCHEDULER !== "false";
  if (!enabled) {
    return;
  }

  const intervalMs = Number(process.env.REMINDER_SCHEDULER_INTERVAL_MS ?? "600000");
  const reminderHours = Number(process.env.REMINDER_HOURS_BEFORE ?? "24");

  const tick = async () => {
    try {
      const runs = await db.query(
        `select id from timetable_runs where status = 'active' and date_end >= current_date`,
      );

      for (const row of runs.rows as Array<{ id: string }>) {
        await service.sendReminderNotifications({ runId: row.id, hoursBefore: reminderHours });
      }
    } catch (error) {
      console.error("Reminder scheduler failed", error);
    }
  };

  void tick();
  setInterval(() => {
    void tick();
  }, intervalMs);
}
