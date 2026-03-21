import { useEffect, useState } from "react";
import { getDashboardKpis, type DashboardResponse } from "../api/dashboardApi";

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setError("");
        const response = await getDashboardKpis();
        setData(response);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
  }, []);

  return (
    <main>
      <section className="page-header">
        <h1>Operational Dashboard</h1>
        <p>Real-time operational KPIs for exam timetable orchestration.</p>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

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
    </main>
  );
}
