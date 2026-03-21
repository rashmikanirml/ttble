import { NextFunction, Response, Router } from "express";
import { db } from "../../config/db.js";
import { AuthRequest, requireAuth, requireRole } from "../../middleware/auth.js";

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

dashboardRouter.get(
  "/dashboard/data-summary",
  requireAuth,
  requireRole(["admin"]),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [
        users,
        studentProfiles,
        staffProfiles,
        subjects,
        exams,
        timetableRuns,
        examSessions,
        eligibility,
        halls,
        hallFacilities,
        hallBookings,
        staffAvailability,
        staffAssignments,
        applications,
        approvals,
      ] = await Promise.all([
        db.query("select count(*)::int as count from users"),
        db.query("select count(*)::int as count from student_profiles"),
        db.query("select count(*)::int as count from staff_profiles"),
        db.query("select count(*)::int as count from subjects"),
        db.query("select count(*)::int as count from exams"),
        db.query("select count(*)::int as count from timetable_runs"),
        db.query("select count(*)::int as count from exam_sessions"),
        db.query("select count(*)::int as count from student_exam_eligibility"),
        db.query("select count(*)::int as count from halls"),
        db.query("select count(*)::int as count from hall_facilities"),
        db.query("select count(*)::int as count from hall_bookings"),
        db.query("select count(*)::int as count from staff_availability"),
        db.query("select count(*)::int as count from staff_assignments"),
        db.query("select count(*)::int as count from repeat_prorata_applications"),
        db.query("select count(*)::int as count from approvals"),
      ]);

      res.json({
        message: "Data summary generated",
        generatedAt: new Date().toISOString(),
        counts: {
          userRoleManagement: {
            users: users.rows[0].count,
            studentProfiles: studentProfiles.rows[0].count,
            staffProfiles: staffProfiles.rows[0].count,
          },
          examTimetableAutoGeneration: {
            subjects: subjects.rows[0].count,
            exams: exams.rows[0].count,
            timetableRuns: timetableRuns.rows[0].count,
            examSessions: examSessions.rows[0].count,
            studentExamEligibility: eligibility.rows[0].count,
          },
          examHallResourceManagement: {
            halls: halls.rows[0].count,
            hallFacilities: hallFacilities.rows[0].count,
            hallBookings: hallBookings.rows[0].count,
          },
          staffAllocationRepeatProrata: {
            staffAvailability: staffAvailability.rows[0].count,
            staffAssignments: staffAssignments.rows[0].count,
            repeatProrataApplications: applications.rows[0].count,
            approvals: approvals.rows[0].count,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
