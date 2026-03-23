import { NextFunction, Request, Response, Router } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { db } from "../../config/db.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

type TimetableReportRow = {
  sessionId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  hallCode: string | null;
  hallName: string | null;
  sessionStatus: string;
  runStatus: string;
};

export const reportingRouter = Router();

async function getTimetableRows(runId: string): Promise<TimetableReportRow[]> {
  const runResult = await db.query(`select id from timetable_runs where id = $1`, [runId]);
  if (!runResult.rowCount) {
    throw notFound("Timetable run not found");
  }

  const result = await db.query(
    `select
       es.id as session_id,
       es.exam_date,
       es.start_time,
       es.end_time,
       s.code as subject_code,
       s.name as subject_name,
       h.code as hall_code,
       h.name as hall_name,
       es.status as session_status,
       tr.status as run_status
     from exam_sessions es
     join timetable_runs tr on tr.id = es.timetable_run_id
     join exams e on e.id = es.exam_id
     join subjects s on s.id = e.subject_id
     left join halls h on h.id = es.hall_id
     where es.timetable_run_id = $1
     order by es.exam_date, es.start_time`,
    [runId],
  );

  return result.rows.map((row: any) => ({
    sessionId: row.session_id,
    examDate: String(row.exam_date).slice(0, 10),
    startTime: row.start_time,
    endTime: row.end_time,
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    hallCode: row.hall_code,
    hallName: row.hall_name,
    sessionStatus: row.session_status,
    runStatus: row.run_status,
  }));
}

reportingRouter.get(
  "/reports/timetable",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const runId = typeof req.query.runId === "string" ? req.query.runId : "";
      if (!runId) {
        throw badRequest("runId query parameter is required");
      }
      const rows = await getTimetableRows(runId);
      res.json({ runId, rows, generatedAt: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  },
);

reportingRouter.get(
  "/reports/hall-utilization",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const from = typeof req.query.from === "string" ? req.query.from : null;
      const to = typeof req.query.to === "string" ? req.query.to : null;
      if (!from || !to) {
        throw badRequest("from and to query parameters are required");
      }

      const result = await db.query(
        `select
           h.id,
           h.code,
           h.name,
           h.capacity,
           count(es.id)::int as session_count,
           coalesce(sum(extract(epoch from (es.end_time - es.start_time)) / 3600), 0)::numeric(10,2) as occupied_hours
         from halls h
         left join exam_sessions es
           on es.hall_id = h.id
          and es.exam_date between $1 and $2
          and es.status <> 'cancelled'
         group by h.id, h.code, h.name, h.capacity
         order by session_count desc, h.code`,
        [from, to],
      );

      res.json({ from, to, halls: result.rows, generatedAt: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  },
);

reportingRouter.get(
  "/reports/staff-workload",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const from = typeof req.query.from === "string" ? req.query.from : null;
      const to = typeof req.query.to === "string" ? req.query.to : null;
      if (!from || !to) {
        throw badRequest("from and to query parameters are required");
      }

      const result = await db.query(
        `select
           u.id as staff_id,
           u.full_name,
           u.email,
           count(sa.id)::int as assigned_sessions,
           coalesce(sum(extract(epoch from (es.end_time - es.start_time)) / 3600), 0)::numeric(10,2) as assigned_hours
         from users u
         left join staff_assignments sa on sa.staff_id = u.id and sa.status <> 'cancelled'
         left join exam_sessions es
           on es.id = sa.exam_session_id
          and es.exam_date between $1 and $2
         where u.role in ('staff', 'admin') and u.status = 'active'
         group by u.id, u.full_name, u.email
         order by assigned_sessions desc, u.full_name`,
        [from, to],
      );

      res.json({ from, to, staff: result.rows, generatedAt: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  },
);

reportingRouter.get(
  "/reports/timetable/export/excel",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const runId = typeof req.query.runId === "string" ? req.query.runId : "";
      if (!runId) {
        throw badRequest("runId query parameter is required");
      }

      const rows = await getTimetableRows(runId);
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Timetable");
      sheet.columns = [
        { header: "Session ID", key: "sessionId", width: 38 },
        { header: "Date", key: "examDate", width: 14 },
        { header: "Start", key: "startTime", width: 10 },
        { header: "End", key: "endTime", width: 10 },
        { header: "Subject Code", key: "subjectCode", width: 16 },
        { header: "Subject Name", key: "subjectName", width: 36 },
        { header: "Hall", key: "hallName", width: 26 },
        { header: "Session Status", key: "sessionStatus", width: 16 },
        { header: "Run Status", key: "runStatus", width: 16 },
      ];
      for (const row of rows) {
        sheet.addRow(row);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=ttble-timetable-${runId}.xlsx`);
      res.send(Buffer.from(buffer));
    } catch (error) {
      next(error);
    }
  },
);

reportingRouter.get(
  "/reports/timetable/export/pdf",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const runId = typeof req.query.runId === "string" ? req.query.runId : "";
      if (!runId) {
        throw badRequest("runId query parameter is required");
      }

      const rows = await getTimetableRows(runId);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=ttble-timetable-${runId}.pdf`);

      const doc = new PDFDocument({ margin: 36, size: "A4" });
      doc.pipe(res);
      doc.fontSize(16).text("Exam Timetable Report", { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(10).text(`Run ID: ${runId}`);
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
      doc.moveDown(0.6);

      for (const row of rows) {
        doc
          .fontSize(10)
          .text(
            `${row.examDate} ${row.startTime}-${row.endTime} | ${row.subjectCode} ${row.subjectName} | Hall: ${row.hallName ?? "TBA"} | Status: ${row.sessionStatus}`,
          );
      }

      doc.end();
    } catch (error) {
      next(error);
    }
  },
);