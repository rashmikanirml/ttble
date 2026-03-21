import "dotenv/config";
import { app } from "./app.js";
import { startReminderScheduler } from "./modules/exam-timetable-auto-generation/reminder.scheduler.js";

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
  startReminderScheduler();
});
