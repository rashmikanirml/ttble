import { NextFunction, Response, Router } from "express";
import { db } from "../../config/db.js";
import { AuthRequest, requireAuth } from "../../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.get("/dashboard/kpis", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [users, subjects, exams, runs, halls, applications] = await Promise.all([
      db.query("select count(*)::int as count from users where status = 'active'"),
      db.query("select count(*)::int as count from subjects"),
      db.query("select count(*)::int as count from exams"),
      db.query("select count(*)::int as count from timetable_runs"),
      db.query("select count(*)::int as count from halls where status = 'active'"),
      db.query("select count(*)::int as count from repeat_prorata_applications where status = 'pending'"),
    ]);

    res.json({
      signedInAs: req.auth,
      kpis: {
        activeUsers: users.rows[0].count,
        subjects: subjects.rows[0].count,
        exams: exams.rows[0].count,
        timetableRuns: runs.rows[0].count,
        activeHalls: halls.rows[0].count,
        pendingApplications: applications.rows[0].count,
      },
    });
  } catch (error) {
    next(error);
  }
});
