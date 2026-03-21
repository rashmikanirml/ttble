import { FormEvent, useEffect, useState } from "react";
import {
  getDashboardKpis,
  getDataSummary,
  runGeneratePublishRemind,
  type DashboardResponse,
  type DataSummaryResponse,
} from "../api/dashboardApi";

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
  const canOrchestrate = currentRole === "admin" || currentRole === "staff";

  useEffect(() => {
    void (async () => {
      try {
        setError("");
        const kpiResponse = await getDashboardKpis();
        setData(kpiResponse);

        if (canOrchestrate) {
          const summaryResponse = await getDataSummary();
          setSummary(summaryResponse);
        } else {
          setSummary(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
  }, [canOrchestrate]);

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

      setNotice(
        `Run ${result.runId} generated ${result.generatedSessions} sessions, notified ${result.studentsNotified} students and ${result.invigilatorsNotified} invigilators, reminders sent ${result.remindersSent}.`,
      );

      const refreshed = await getDashboardKpis();
      setData(refreshed);
      const refreshedSummary = await getDataSummary();
      setSummary(refreshedSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed orchestration");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <section className="page-header">
        <h1>Operational Dashboard</h1>
        <p>Real-time operational KPIs for exam timetable orchestration.</p>
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
          <p>One-click orchestration to run advanced clash-free generation, publish notices, and trigger reminders.</p>
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
    </main>
  );
}
