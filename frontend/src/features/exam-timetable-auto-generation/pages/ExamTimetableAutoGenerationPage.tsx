import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  approveTimetableRun,
  applyForExam,
  applyForInvigilation,
  createExam,
  createSubject,
  getTimetableRunDetails,
  getTimetableAiInsights,
  generateTimetable,
  listExamApplications,
  listExams,
  listInvigilationApplications,
  listTimetableRuns,
  listSubjects,
  publishTimetableRun,
  simulateTimetablePlan,
} from "../api/examTimetableApi";
import type {
  Exam,
  ExamApplication,
  ExamSession,
  InvigilationApplication,
  Subject,
  TimetableAiInsights,
  TimetableGenerationResult,
  TimetableSimulationResult,
} from "../types/models";

export function ExamTimetableAutoGenerationPage({ currentRole, currentUserId }: { currentRole: string; currentUserId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [runId, setRunId] = useState<string>("");
  const [timetableRuns, setTimetableRuns] = useState<Array<TimetableGenerationResult["run"]>>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [insights, setInsights] = useState<TimetableAiInsights | null>(null);
  const [simulation, setSimulation] = useState<TimetableSimulationResult | null>(null);
  const [examApplications, setExamApplications] = useState<ExamApplication[]>([]);
  const [invigilationApplications, setInvigilationApplications] = useState<InvigilationApplication[]>([]);
  const [examApplyId, setExamApplyId] = useState("");
  const [examApplyNotice, setExamApplyNotice] = useState("");
  const [invigilationExamId, setInvigilationExamId] = useState("");
  const [invigilationMotivation, setInvigilationMotivation] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const canManageTimetable = currentRole === "admin" || currentRole === "staff";
  const canApplyExam = currentRole === "student";
  const canApplyInvigilation = currentRole === "staff";

  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [yearNo, setYearNo] = useState(1);
  const [semesterNo, setSemesterNo] = useState(1);

  const [examSubjectId, setExamSubjectId] = useState("");
  const [examType, setExamType] = useState("final");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [studentCohort, setStudentCohort] = useState("all");

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [maxExamsPerDay, setMaxExamsPerDay] = useState(3);
  const [createdBy, setCreatedBy] = useState(currentUserId || "");
  const [workflowNote, setWorkflowNote] = useState("");
  const [runStatus, setRunStatus] = useState("");

  async function runSimulation() {
    setFieldErrors({});
    if (!dateStart || !dateEnd) {
      setFieldErrors({ dateStart: "Set date range first to run AI simulation.", dateEnd: "Set date range first to run AI simulation." });
      return;
    }
    if (dateStart > dateEnd) {
      setFieldErrors({ dateEnd: "Start date cannot be after end date." });
      return;
    }
    try {
      setErrorMessage("");
      const result = await simulateTimetablePlan({
        dateStart,
        dateEnd,
        totalExams: exams.length,
        maxExamsPerDay,
      });
      setSimulation(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to run simulation");
    }
  }

  async function loadData() {
    try {
      setErrorMessage("");
      const [subjectData, examData, runData] = await Promise.all([listSubjects(), listExams(), listTimetableRuns(30)]);
      setSubjects(subjectData);
      setExams(examData);
      setTimetableRuns(runData);

      if (canManageTimetable) {
        const [examApplicationData, invigilationApplicationData] = await Promise.all([
          listExamApplications(),
          listInvigilationApplications(),
        ]);
        setExamApplications(examApplicationData);
        setInvigilationApplications(invigilationApplicationData);
      }

      if (!examSubjectId && subjectData.length) {
        setExamSubjectId(subjectData[0].id);
      }
      if (!examApplyId && examData.length) {
        setExamApplyId(examData[0].id);
      }
      if (!invigilationExamId && examData.length) {
        setInvigilationExamId(examData[0].id);
      }

      if (!runId && runData.length) {
        const latest = runData[0];
        const details = await getTimetableRunDetails(latest.id);
        setRunId(latest.id);
        setRunStatus(latest.status);
        setSessions(details.sessions);
        const aiInsights = await getTimetableAiInsights(latest.id);
        setInsights(aiInsights);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load data");
    }
  }

  useEffect(() => {
    void loadData();
  }, [canManageTimetable]);

  useEffect(() => {
    setCreatedBy(currentUserId || "");
  }, [currentUserId]);

  async function onCreateSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      setSuccessMessage("");
      setFieldErrors({});
      if (subjectCode.trim().length < 2 || subjectCode.trim().length > 20) {
        setFieldErrors({ subjectCode: "Subject code must be between 2 and 20 characters." });
        return;
      }
      if (subjectName.trim().length < 3) {
        setFieldErrors({ subjectName: "Subject name must be at least 3 characters." });
        return;
      }
      if (yearNo < 1 || semesterNo < 1) {
        setFieldErrors({ yearNo: "Year and semester must be at least 1.", semesterNo: "Year and semester must be at least 1." });
        return;
      }

      await createSubject({ code: subjectCode.trim(), name: subjectName.trim(), yearNo, semesterNo });
      setSubjectCode("");
      setSubjectName("");
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create subject");
    }
  }

  async function onCreateExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      setSuccessMessage("");
      setFieldErrors({});
      if (!examSubjectId) {
        setFieldErrors({ examSubjectId: "Select a subject before creating an exam." });
        return;
      }
      if (examType.trim().length < 3) {
        setFieldErrors({ examType: "Exam type must be at least 3 characters." });
        return;
      }
      if (durationMinutes < 30 || durationMinutes > 360) {
        setFieldErrors({ durationMinutes: "Exam duration must be between 30 and 360 minutes." });
        return;
      }
      if (studentCohort.trim().length < 2) {
        setFieldErrors({ studentCohort: "Student cohort must be at least 2 characters." });
        return;
      }

      await createExam({
        subjectId: examSubjectId,
        examType: examType.trim(),
        durationMinutes,
        studentCohort: studentCohort.trim(),
      });
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create exam");
    }
  }

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      setSuccessMessage("");
      setFieldErrors({});
      if (!dateStart || !dateEnd) {
        setFieldErrors({ dateStart: "Select both start and end dates.", dateEnd: "Select both start and end dates." });
        return;
      }
      if (dateStart > dateEnd) {
        setFieldErrors({ dateEnd: "Start date cannot be after end date." });
        return;
      }
      if (maxExamsPerDay < 1 || maxExamsPerDay > 8) {
        setFieldErrors({ maxExamsPerDay: "Max exams per day must be between 1 and 8." });
        return;
      }
      if (createdBy.trim().length < 6) {
        setFieldErrors({ createdBy: "Created by user ID should be at least 6 characters." });
        return;
      }

      const generated = await generateTimetable({
        dateStart,
        dateEnd,
        createdBy: createdBy.trim(),
        maxExamsPerDay,
      });
      setRunId(generated.run.id);
      setRunStatus(generated.run.status);
      setSessions(generated.sessions);
      const aiInsights = await getTimetableAiInsights(generated.run.id);
      setInsights(aiInsights);
      setSuccessMessage("Timetable generated successfully.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate timetable");
    }
  }

  async function onApproveRun() {
    try {
      setFieldErrors({});
      if (!runId.trim()) {
        setFieldErrors({ runId: "Generate a timetable first." });
        return;
      }
      const updated = await approveTimetableRun(runId.trim(), workflowNote.trim() || undefined);
      setRunStatus(updated.status);
      setSuccessMessage(`Run ${updated.id} moved to ${updated.status}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to approve timetable run");
    }
  }

  async function onPublishRun() {
    try {
      setFieldErrors({});
      if (!runId.trim()) {
        setFieldErrors({ runId: "Generate a timetable first." });
        return;
      }
      const updated = await publishTimetableRun(runId.trim());
      setRunStatus(updated.status);
      setSuccessMessage(`Run ${updated.id} moved to ${updated.status}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to publish timetable run");
    }
  }

  async function onApplyForExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      setSuccessMessage("");
      setFieldErrors({});
      if (!examApplyId) {
        setFieldErrors({ examApplyId: "Select an exam to apply." });
        return;
      }
      const created = await applyForExam({ examId: examApplyId, noticeText: examApplyNotice.trim() || undefined });
      setExamApplyNotice("");
      setSuccessMessage("Exam application submitted.");
      if (canManageTimetable) {
        const refreshed = await listExamApplications();
        setExamApplications(refreshed);
      } else {
        setExamApplications((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit exam application");
    }
  }

  async function onApplyForInvigilation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      setSuccessMessage("");
      setFieldErrors({});
      if (!invigilationExamId) {
        setFieldErrors({ invigilationExamId: "Select an exam for invigilation application." });
        return;
      }
      const created = await applyForInvigilation({
        examId: invigilationExamId,
        motivation: invigilationMotivation.trim() || undefined,
      });
      setInvigilationMotivation("");
      setSuccessMessage("Invigilation application submitted.");
      if (canManageTimetable) {
        const refreshed = await listInvigilationApplications();
        setInvigilationApplications(refreshed);
      } else {
        setInvigilationApplications((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit invigilation application");
    }
  }

  async function onLoadRun() {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      setFieldErrors({});
      if (!runId.trim()) {
        setFieldErrors({ runId: "Enter or select a timetable run ID first." });
        return;
      }

      const details = await getTimetableRunDetails(runId.trim());
      setRunStatus(details.run.status);
      setSessions(details.sessions);
      const aiInsights = await getTimetableAiInsights(runId.trim());
      setInsights(aiInsights);
      setSuccessMessage(`Loaded timetable run ${runId.trim()} with ${details.sessions.length} sessions.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch timetable run");
    }
  }

  const examIndex = useMemo(() => {
    return new Map(exams.map((exam) => [exam.id, exam]));
  }, [exams]);

  return (
    <main>
      <section className="page-header">
        <h1>Exam Timetable Auto Generation</h1>
        <p>Define subjects and exams, then generate sessions within a validated date range.</p>
      </section>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      {successMessage ? <div className="success-banner">{successMessage}</div> : null}

      {canApplyExam ? (
        <section className="card">
        <h2>Student Exam Applications</h2>
        <form onSubmit={onApplyForExam} className="form-grid">
          <label className="form-field">
            <span className="field-label">Exam</span>
            <select className="app-select" value={examApplyId} onChange={(event) => setExamApplyId(event.target.value)} required>
              <option value="" disabled>
                Select Exam
              </option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.examType} - {exam.studentCohort}
                </option>
              ))}
            </select>
            {fieldErrors.examApplyId ? <span className="field-error">{fieldErrors.examApplyId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Notice/Reason (optional)</span>
            <textarea
              className="app-input"
              value={examApplyNotice}
              onChange={(event) => setExamApplyNotice(event.target.value)}
              rows={3}
            />
          </label>
          <button className="app-button" type="submit">Apply for Exam</button>
        </form>
        {examApplications.length ? (
          <table className="app-table">
            <thead>
              <tr>
                <th align="left">Exam</th>
                <th align="left">Status</th>
                <th align="left">Notice</th>
              </tr>
            </thead>
            <tbody>
              {examApplications.map((app) => {
                const exam = examIndex.get(app.examId);
                return (
                  <tr key={app.id}>
                    <td>{exam ? `${exam.examType} (${exam.studentCohort})` : app.examId}</td>
                    <td>{app.status}</td>
                    <td>{app.noticeText || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No exam applications yet.</p>
        )}
        </section>
      ) : null}

      {canApplyInvigilation ? (
        <section className="card">
        <h2>Lecturer Invigilation Applications</h2>
        <form onSubmit={onApplyForInvigilation} className="form-grid">
          <label className="form-field">
            <span className="field-label">Exam</span>
            <select
              className="app-select"
              value={invigilationExamId}
              onChange={(event) => setInvigilationExamId(event.target.value)}
              required
            >
              <option value="" disabled>
                Select Exam
              </option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.examType} - {exam.studentCohort}
                </option>
              ))}
            </select>
            {fieldErrors.invigilationExamId ? <span className="field-error">{fieldErrors.invigilationExamId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Motivation (optional)</span>
            <textarea
              className="app-input"
              value={invigilationMotivation}
              onChange={(event) => setInvigilationMotivation(event.target.value)}
              rows={3}
            />
          </label>
          <button className="app-button" type="submit">Apply for Invigilation</button>
        </form>
        {invigilationApplications.length ? (
          <table className="app-table">
            <thead>
              <tr>
                <th align="left">Exam</th>
                <th align="left">Status</th>
                <th align="left">Motivation</th>
              </tr>
            </thead>
            <tbody>
              {invigilationApplications.map((app) => {
                const exam = examIndex.get(app.examId);
                return (
                  <tr key={app.id}>
                    <td>{exam ? `${exam.examType} (${exam.studentCohort})` : app.examId}</td>
                    <td>{app.status}</td>
                    <td>{app.motivation || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No invigilation applications yet.</p>
        )}
        </section>
      ) : null}

      {canManageTimetable ? (
        <section className="card">
        <h2>Create Subject</h2>
        <form onSubmit={onCreateSubject} className="form-grid">
          <label className="form-field">
            <span className="field-label">Subject Code</span>
            <input className="app-input" value={subjectCode} onChange={(event) => setSubjectCode(event.target.value)} required />
            {fieldErrors.subjectCode ? <span className="field-error">{fieldErrors.subjectCode}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Subject Name</span>
            <input className="app-input" value={subjectName} onChange={(event) => setSubjectName(event.target.value)} required />
            {fieldErrors.subjectName ? <span className="field-error">{fieldErrors.subjectName}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Year</span>
            <input
              className="app-input"
              type="number"
              value={yearNo}
              min={1}
              onChange={(event) => setYearNo(Number(event.target.value))}
              required
            />
            {fieldErrors.yearNo ? <span className="field-error">{fieldErrors.yearNo}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Semester</span>
            <input
              className="app-input"
              type="number"
              value={semesterNo}
              min={1}
              onChange={(event) => setSemesterNo(Number(event.target.value))}
              required
            />
            {fieldErrors.semesterNo ? <span className="field-error">{fieldErrors.semesterNo}</span> : null}
          </label>
          <button className="app-button" type="submit">Add Subject</button>
        </form>
        </section>
      ) : null}

      {canManageTimetable ? (
        <section className="card">
          <h2>Workflow Status Management</h2>
          <div className="form-grid">
            <label className="form-field">
              <span className="field-label">Timetable Run ID</span>
              <input className="app-input" value={runId} onChange={(event) => setRunId(event.target.value)} />
              {fieldErrors.runId ? <span className="field-error">{fieldErrors.runId}</span> : null}
            </label>
            {timetableRuns.length ? (
              <label className="form-field">
                <span className="field-label">Existing Timetable Runs</span>
                <select className="app-select" value={runId} onChange={(event) => setRunId(event.target.value)}>
                  <option value="">Select existing timetable run</option>
                  {timetableRuns.map((run) => (
                    <option key={run.id} value={run.id}>
                      {run.id} | {run.dateStart} to {run.dateEnd} | {run.status}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="form-field">
              <span className="field-label">Approval Note (optional)</span>
              <input className="app-input" value={workflowNote} onChange={(event) => setWorkflowNote(event.target.value)} />
            </label>
            <p>Current run status: <strong>{runStatus || "unknown"}</strong></p>
            <div className="inline-row">
              <button className="app-button" type="button" onClick={() => void onLoadRun()}>Load Run</button>
              <button className="app-button" type="button" onClick={() => void onApproveRun()}>Approve Run</button>
              <button className="app-button" type="button" onClick={() => void onPublishRun()}>Publish Run</button>
            </div>
          </div>
        </section>
      ) : null}

      {canManageTimetable ? (
        <section className="card">
        <h2>Create Exam</h2>
        <form onSubmit={onCreateExam} className="form-grid">
          <label className="form-field">
            <span className="field-label">Subject</span>
            <select className="app-select" value={examSubjectId} onChange={(event) => setExamSubjectId(event.target.value)} required>
              <option value="" disabled>
                Select Subject
              </option>
              {subjects.map((subject) => (
                <option value={subject.id} key={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
            {fieldErrors.examSubjectId ? <span className="field-error">{fieldErrors.examSubjectId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Exam Type</span>
            <input className="app-input" value={examType} onChange={(event) => setExamType(event.target.value)} required />
            {fieldErrors.examType ? <span className="field-error">{fieldErrors.examType}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Duration (minutes)</span>
            <input
              className="app-input"
              type="number"
              value={durationMinutes}
              min={30}
              step={5}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              required
            />
            {fieldErrors.durationMinutes ? <span className="field-error">{fieldErrors.durationMinutes}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Student Cohort</span>
            <input
              className="app-input"
              value={studentCohort}
              onChange={(event) => setStudentCohort(event.target.value)}
              required
            />
            {fieldErrors.studentCohort ? <span className="field-error">{fieldErrors.studentCohort}</span> : null}
          </label>
          <button className="app-button" type="submit">Add Exam</button>
        </form>
        </section>
      ) : null}

      {canManageTimetable ? (
        <section className="card">
        <h2>Generate Timetable</h2>
        <form onSubmit={onGenerate} className="form-grid">
          <label className="form-field">
            <span className="field-label">Start Date</span>
            <input className="app-input" type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} required />
            {fieldErrors.dateStart ? <span className="field-error">{fieldErrors.dateStart}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">End Date</span>
            <input className="app-input" type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} required />
            {fieldErrors.dateEnd ? <span className="field-error">{fieldErrors.dateEnd}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Created By (User ID)</span>
            <input className="app-input" value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} required />
            {fieldErrors.createdBy ? <span className="field-error">{fieldErrors.createdBy}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Max Exams Per Day</span>
            <input
              className="app-input"
              type="number"
              value={maxExamsPerDay}
              min={1}
              onChange={(event) => setMaxExamsPerDay(Number(event.target.value))}
            />
            {fieldErrors.maxExamsPerDay ? <span className="field-error">{fieldErrors.maxExamsPerDay}</span> : null}
          </label>
          <button className="app-button" type="submit">Generate</button>
          <button className="app-button" type="button" onClick={runSimulation}>
            Run AI What-If Simulation
          </button>
        </form>
        </section>
      ) : null}

      {canManageTimetable ? (
        <section className="card">
        <h2>AI Planning Assistant</h2>
        {simulation ? (
          <div>
            <p>
              Feasible: <strong>{simulation.feasible ? "Yes" : "No"}</strong> | Confidence: <strong>{simulation.confidenceScore}%</strong>
            </p>
            <p>
              Required Days: {simulation.requiredDays} | Available Days: {simulation.availableDays} | Pressure: {simulation.schedulePressure}
            </p>
            <ul>
              {simulation.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Run simulation to preview schedule feasibility and pressure.</p>
        )}

        {insights ? (
          <div>
            <p>
              AI Risk Score: <strong>{insights.riskScore}/100</strong> | Pressure: <strong>{insights.schedulePressure}</strong>
            </p>
            <p>
              Sessions: {insights.kpis.totalSessions} | Days: {insights.kpis.totalDays} | Avg Duration: {insights.kpis.avgDurationMinutes} min | Exams/Day: {insights.kpis.examsPerDay}
            </p>
            <ul>
              {insights.recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Generate a timetable to receive AI quality insights.</p>
        )}
        </section>
      ) : null}

      {canManageTimetable ? (
        <section className="card">
        <h2>Generated Sessions</h2>
        {runId ? <p>Run ID: {runId}</p> : <p>No generated run yet.</p>}
        {!sessions.length ? (
          <p>No sessions generated yet.</p>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th align="left">Date</th>
                <th align="left">Start</th>
                <th align="left">End</th>
                <th align="left">Exam</th>
                <th align="left">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const exam = examIndex.get(session.examId);
                return (
                  <tr key={session.id}>
                    <td>{session.examDate}</td>
                    <td>{session.startTime}</td>
                    <td>{session.endTime}</td>
                    <td>{exam ? `${exam.examType} (${exam.studentCohort})` : session.examId}</td>
                    <td>{session.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </section>
      ) : null}

      {!canManageTimetable && !canApplyExam && !canApplyInvigilation ? (
        <section className="card">
          <h2>Role Access</h2>
          <p>Your role has limited access in this module.</p>
        </section>
      ) : null}
    </main>
  );
}
