import { FormEvent, useEffect, useMemo, useState } from "react";
import { listExamApplications } from "../../exam-timetable-auto-generation/api/examTimetableApi";
import type { ExamApplication } from "../../exam-timetable-auto-generation/types/models";
import { getMyStaffCalendar } from "../../staff-allocation-repeat-prorata/api/staffAllocationApi";
import type { StaffCalendarItem } from "../../staff-allocation-repeat-prorata/types/models";
import {
  exportTimetableExcel,
  exportTimetablePdf,
  getDashboardKpis,
  getDataSummary,
  getHallUtilization,
  getStaffWorkload,
  listNotifications,
  listSettings,
  markNotificationRead,
  runGeneratePublishRemind,
  updateSetting,
  type DashboardResponse,
  type DataSummaryResponse,
  type HallUtilizationReport,
  type InAppNotification,
  type StaffWorkloadReport,
  type SystemSetting,
} from "../api/dashboardApi";

function toSettingInput(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

function parseSettingInput(input: string): unknown {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }
    return trimmed;
  }
}

export function DashboardPage({ currentRole }: { currentRole: string }) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [summary, setSummary] = useState<DataSummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [maxExamsPerDay, setMaxExamsPerDay] = useState(3);
  const [reminderHours, setReminderHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [examApplications, setExamApplications] = useState<ExamApplication[]>([]);
  const [staffCalendar, setStaffCalendar] = useState<StaffCalendarItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [hallReport, setHallReport] = useState<HallUtilizationReport | null>(null);
  const [staffReport, setStaffReport] = useState<StaffWorkloadReport | null>(null);

  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [runIdForExport, setRunIdForExport] = useState("");

  const canOrchestrate = currentRole === "admin" || currentRole === "staff";
  const isAdmin = currentRole === "admin";
  const isStaff = currentRole === "staff";
  const isStudent = currentRole === "student";

  async function refreshNotifications() {
    const response = await listNotifications();
    setNotifications(response);
  }

  async function refreshAdminInsights(from: string, to: string) {
    const [halls, staff, currentSettings] = await Promise.all([
      getHallUtilization(from, to),
      getStaffWorkload(from, to),
      listSettings(),
    ]);
    setHallReport(halls);
    setStaffReport(staff);
    setSettings(currentSettings);
    const drafts: Record<string, string> = {};
    for (const setting of currentSettings) {
      drafts[setting.key] = toSettingInput(setting.value);
    }
    setSettingDrafts(drafts);
  }

  async function loadDashboard() {
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 30);
    const from = fromDate.toISOString().slice(0, 10);

    setReportFrom(from);
    setReportTo(to);

    const kpiResponse = await getDashboardKpis();
    setData(kpiResponse);

    if (canOrchestrate) {
      const summaryResponse = await getDataSummary();
      setSummary(summaryResponse);
    } else {
      setSummary(null);
    }

    if (isStudent) {
      const myApps = await listExamApplications();
      setExamApplications(myApps);
    }

    if (isStaff) {
      const calendar = await getMyStaffCalendar(from, to);
      setStaffCalendar(calendar);
    }

    if (isAdmin) {
      await refreshAdminInsights(from, to);
    }

    await refreshNotifications();
  }

  useEffect(() => {
    void (async () => {
      try {
        setError("");
        await loadDashboard();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
  }, [canOrchestrate, isAdmin, isStaff, isStudent]);

  async function onRunOrchestration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) {
      setError("Dashboard identity is not loaded yet.");
      return;
    }
    if (data.signedInAs.role !== "admin" && data.signedInAs.role !== "staff") {
      setError("Only admin/staff can run orchestration.");
      return;
    }
    if (!dateStart || !dateEnd) {
      setError("Select start and end dates.");
      return;
    }
    if (dateStart > dateEnd) {
      setError("Start date cannot be after end date.");
      return;
    }

    try {
      setError("");
      setNotice("");
      setIsSubmitting(true);
      const result = await runGeneratePublishRemind({
        dateStart,
        dateEnd,
        createdBy: data.signedInAs.userId,
        maxExamsPerDay,
        reminderHours,
      });

      setRunIdForExport(result.runId);
      setNotice(
        `Run ${result.runId} generated ${result.generatedSessions} sessions, notified ${result.studentsNotified} students and ${result.invigilatorsNotified} invigilators, reminders sent ${result.remindersSent}.`,
      );

      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed orchestration");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onRefreshReports() {
    if (!reportFrom || !reportTo) {
      setError("Pick a report date range first.");
      return;
    }
    if (reportFrom > reportTo) {
      setError("Report start date cannot be after end date.");
      return;
    }

    try {
      setError("");
      await refreshAdminInsights(reportFrom, reportTo);
      setNotice("Admin analytics refreshed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh analytics");
    }
  }

  async function onSaveSetting(setting: SystemSetting) {
    try {
      setError("");
      const draft = settingDrafts[setting.key] ?? toSettingInput(setting.value);
      const updated = await updateSetting(setting.key, parseSettingInput(draft), setting.description ?? undefined);
      setSettings((prev) => prev.map((item) => (item.key === updated.key ? updated : item)));
      setNotice(`Setting ${setting.key} updated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update setting");
    }
  }

  async function onMarkNotificationRead(notificationId: string) {
    try {
      setError("");
      await markNotificationRead(notificationId);
      await refreshNotifications();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update notification");
    }
  }

  async function onDownload(format: "excel" | "pdf") {
    if (!runIdForExport.trim()) {
      setError("Provide a run ID to export reports.");
      return;
    }

    try {
      setError("");
      if (format === "excel") {
        await exportTimetableExcel(runIdForExport.trim());
      } else {
        await exportTimetablePdf(runIdForExport.trim());
      }
      setNotice(`Timetable ${format.toUpperCase()} download started.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download report");
    }
  }

  const unreadNotifications = useMemo(() => notifications.filter((item) => !item.is_read), [notifications]);

  return (
    <main>
      <section className="page-header">
        <h1>Operational Dashboard</h1>
        <p>
          {isAdmin
            ? "Admin overview with analytics, exports, settings, and live operations controls."
            : isStaff
              ? "Staff dashboard with assignment calendar, operations control, and alerts."
              : "Student dashboard with application tracking and personalized notifications."}
        </p>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {notice ? <div className="success-banner">{notice}</div> : null}

      <section className="card">
        {!data ? (
          <p>Loading KPIs...</p>
        ) : (
          <div className="kpi-grid">
            <article className="kpi-card"><h3>Active Users</h3><strong>{data.kpis.activeUsers}</strong></article>
            <article className="kpi-card"><h3>Subjects</h3><strong>{data.kpis.subjects}</strong></article>
            <article className="kpi-card"><h3>Exams</h3><strong>{data.kpis.exams}</strong></article>
            <article className="kpi-card"><h3>Timetable Runs</h3><strong>{data.kpis.timetableRuns}</strong></article>
            <article className="kpi-card"><h3>Active Halls</h3><strong>{data.kpis.activeHalls}</strong></article>
            <article className="kpi-card"><h3>Pending Applications</h3><strong>{data.kpis.pendingApplications}</strong></article>
          </div>
        )}
      </section>

      {canOrchestrate ? (
        <section className="card">
          <h2>Generate + Publish + Remind</h2>
          <p>Run advanced timetable orchestration with notifications and reminders.</p>
          <form className="form-grid" onSubmit={onRunOrchestration}>
            <label>
              Start Date
              <input className="app-input" type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} required />
            </label>
            <label>
              End Date
              <input className="app-input" type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} required />
            </label>
            <label>
              Max Exams Per Day
              <input
                className="app-input"
                type="number"
                min={1}
                max={8}
                value={maxExamsPerDay}
                onChange={(event) => setMaxExamsPerDay(Number(event.target.value))}
              />
            </label>
            <label>
              Reminder Window (Hours)
              <input
                className="app-input"
                type="number"
                min={1}
                max={168}
                value={reminderHours}
                onChange={(event) => setReminderHours(Number(event.target.value))}
              />
            </label>
            <button className="app-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Running..." : "Run Orchestration"}
            </button>
          </form>
        </section>
      ) : null}

      {canOrchestrate ? (
        <section className="card">
          <h2>Data Summary</h2>
          {!summary ? (
            <p>Loading data summary...</p>
          ) : (
            <div className="kpi-grid">
              {Object.entries(summary.counts).map(([group, values]) => (
                <article className="kpi-card" key={group}>
                  <h3>{group}</h3>
                  {Object.entries(values).map(([key, count]) => (
                    <p key={key}>
                      {key}: <strong>{count}</strong>
                    </p>
                  ))}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {isStudent ? (
        <section className="card">
          <h2>My Exam Applications</h2>
          {!examApplications.length ? (
            <p>No exam applications yet.</p>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th align="left">Exam ID</th>
                  <th align="left">Status</th>
                  <th align="left">Notice</th>
                  <th align="left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {examApplications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.examId}</td>
                    <td>{app.status}</td>
                    <td>{app.noticeText || "-"}</td>
                    <td>{new Date(app.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {isStaff ? (
        <section className="card">
          <h2>My Staff Calendar</h2>
          {!staffCalendar.length ? (
            <p>No scheduled assignments in the current window.</p>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th align="left">Date</th>
                  <th align="left">Time</th>
                  <th align="left">Subject</th>
                  <th align="left">Role</th>
                  <th align="left">Hall</th>
                  <th align="left">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffCalendar.map((item) => (
                  <tr key={item.assignmentId}>
                    <td>{item.examDate}</td>
                    <td>{item.startTime} - {item.endTime}</td>
                    <td>{item.subjectCode} {item.subjectName}</td>
                    <td>{item.roleInSession}</td>
                    <td>{item.hallName || "TBA"}</td>
                    <td>{item.assignmentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {isAdmin ? (
        <section className="card">
          <h2>Admin Analytics & Reports</h2>
          <div className="form-grid">
            <label>
              From
              <input className="app-input" type="date" value={reportFrom} onChange={(event) => setReportFrom(event.target.value)} />
            </label>
            <label>
              To
              <input className="app-input" type="date" value={reportTo} onChange={(event) => setReportTo(event.target.value)} />
            </label>
            <button className="app-button" type="button" onClick={onRefreshReports}>Refresh Analytics</button>
          </div>

          <div className="kpi-grid" style={{ marginTop: 12 }}>
            <article className="kpi-card">
              <h3>Hall Utilization</h3>
              <strong>{hallReport?.halls.length ?? 0}</strong>
              <p>halls in report window</p>
            </article>
            <article className="kpi-card">
              <h3>Staff Workload</h3>
              <strong>{staffReport?.staff.length ?? 0}</strong>
              <p>staff in workload report</p>
            </article>
            <article className="kpi-card">
              <h3>Unread Alerts</h3>
              <strong>{unreadNotifications.length}</strong>
              <p>pending notifications</p>
            </article>
          </div>

          <div className="form-grid" style={{ marginTop: 12 }}>
            <label>
              Timetable Run ID for Export
              <input
                className="app-input"
                value={runIdForExport}
                onChange={(event) => setRunIdForExport(event.target.value)}
                placeholder="Paste run ID"
              />
            </label>
            <div className="inline-row">
              <button className="app-button" type="button" onClick={() => void onDownload("excel")}>Export Excel</button>
              <button className="app-button" type="button" onClick={() => void onDownload("pdf")}>Export PDF</button>
            </div>
          </div>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="card">
          <h2>System Settings</h2>
          {!settings.length ? (
            <p>No settings available.</p>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th align="left">Key</th>
                  <th align="left">Value</th>
                  <th align="left">Description</th>
                  <th align="left">Action</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting) => (
                  <tr key={setting.key}>
                    <td>{setting.key}</td>
                    <td>
                      <input
                        className="app-input"
                        value={settingDrafts[setting.key] ?? ""}
                        onChange={(event) =>
                          setSettingDrafts((prev) => ({
                            ...prev,
                            [setting.key]: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>{setting.description || "-"}</td>
                    <td>
                      <button className="app-button" type="button" onClick={() => void onSaveSetting(setting)}>
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      <section className="card">
        <h2>Notifications</h2>
        {!notifications.length ? (
          <p>No notifications yet.</p>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th align="left">Title</th>
                <th align="left">Message</th>
                <th align="left">When</th>
                <th align="left">Status</th>
                <th align="left">Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.message}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>{item.is_read ? "read" : "unread"}</td>
                  <td>
                    <button
                      className="app-button"
                      type="button"
                      disabled={item.is_read}
                      onClick={() => void onMarkNotificationRead(item.id)}
                    >
                      Mark Read
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
