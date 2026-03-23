import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  approveTimetableRun,
  applyForExam,
  applyForInvigilation,
  createExam,
  createSubject,
  getTimetableAiInsights,
  generateTimetable,
  listExamApplications,
  listExams,
  listInvigilationApplications,
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
  TimetableSimulationResult,
} from "../types/models";

export function ExamTimetableAutoGenerationPage({ currentRole, currentUserId }: { currentRole: string; currentUserId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [runId, setRunId] = useState<string>("");
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
    if (!dateStart || !dateEnd) {
      setErrorMessage("Set date range first to run AI simulation.");
      return;
    }
    if (dateStart > dateEnd) {
      setErrorMessage("Start date cannot be after end date.");
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
      const [subjectData, examData] = await Promise.all([listSubjects(), listExams()]);
      setSubjects(subjectData);
      setExams(examData);

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
      if (subjectCode.trim().length < 2 || subjectCode.trim().length > 20) {
        setErrorMessage("Subject code must be between 2 and 20 characters.");
        return;
      }
      if (subjectName.trim().length < 3) {
        setErrorMessage("Subject name must be at least 3 characters.");
        return;
      }
      if (yearNo < 1 || semesterNo < 1) {
        setErrorMessage("Year and semester must be at least 1.");
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
      if (!examSubjectId) {
        setErrorMessage("Select a subject before creating an exam.");
        return;
      }
      if (examType.trim().length < 3) {
        setErrorMessage("Exam type must be at least 3 characters.");
        return;
      }
      if (durationMinutes < 30 || durationMinutes > 360) {
        setErrorMessage("Exam duration must be between 30 and 360 minutes.");
        return;
      }
      if (studentCohort.trim().length < 2) {
        setErrorMessage("Student cohort must be at least 2 characters.");
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
      if (!dateStart || !dateEnd) {
        setErrorMessage("Select both start and end dates.");
        return;
      }
      if (dateStart > dateEnd) {
        setErrorMessage("Start date cannot be after end date.");
        return;
      }
      if (maxExamsPerDay < 1 || maxExamsPerDay > 8) {
        setErrorMessage("Max exams per day must be between 1 and 8.");
        return;
      }
      if (createdBy.trim().length < 6) {
        setErrorMessage("Created by user ID should be at least 6 characters.");
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
      if (!runId.trim()) {
        setErrorMessage("Generate a timetable first.");
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
      if (!runId.trim()) {
        setErrorMessage("Generate a timetable first.");
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
      if (!examApplyId) {
        setErrorMessage("Select an exam to apply.");
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
      if (!invigilationExamId) {
        setErrorMessage("Select an exam for invigilation application.");
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
          <textarea
            className="app-input"
            value={examApplyNotice}
            onChange={(event) => setExamApplyNotice(event.target.value)}
            placeholder="Notice/Reason"
            rows={3}
          />
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
          <textarea
            className="app-input"
            value={invigilationMotivation}
            onChange={(event) => setInvigilationMotivation(event.target.value)}
            placeholder="Motivation"
            rows={3}
          />
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
          <input className="app-input" value={subjectCode} onChange={(event) => setSubjectCode(event.target.value)} placeholder="Code" required />
          <input className="app-input" value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder="Name" required />
          <input
            className="app-input"
            type="number"
            value={yearNo}
            min={1}
            onChange={(event) => setYearNo(Number(event.target.value))}
            placeholder="Year"
            required
          />
          <input
            className="app-input"
            type="number"
            value={semesterNo}
            min={1}
            onChange={(event) => setSemesterNo(Number(event.target.value))}
            placeholder="Semester"
            required
          />
          <button className="app-button" type="submit">Add Subject</button>
        </form>
        </section>
      ) : null}

      {canManageTimetable ? (
        <section className="card">
          <h2>Workflow Status Management</h2>
          <div className="form-grid">
            <input className="app-input" value={runId} onChange={(event) => setRunId(event.target.value)} placeholder="Timetable Run ID" />
            <input className="app-input" value={workflowNote} onChange={(event) => setWorkflowNote(event.target.value)} placeholder="Approval note (optional)" />
            <p>Current run status: <strong>{runStatus || "unknown"}</strong></p>
            <div className="inline-row">
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
          <input className="app-input" value={examType} onChange={(event) => setExamType(event.target.value)} placeholder="Exam Type" required />
          <input
            className="app-input"
            type="number"
            value={durationMinutes}
            min={30}
            step={5}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            placeholder="Duration"
            required
          />
          <input
            className="app-input"
            value={studentCohort}
            onChange={(event) => setStudentCohort(event.target.value)}
            placeholder="Student Cohort"
            required
          />
          <button className="app-button" type="submit">Add Exam</button>
        </form>
        </section>
      ) : null}

      {canManageTimetable ? (
        <section className="card">
        <h2>Generate Timetable</h2>
        <form onSubmit={onGenerate} className="form-grid">
          <label>
            Start Date
            <input className="app-input" type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} required />
          </label>
          <label>
            End Date
            <input className="app-input" type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} required />
          </label>
          <label>
            Created By (User ID)
            <input className="app-input" value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} required />
          </label>
          <label>
            Max Exams Per Day
            <input
              className="app-input"
              type="number"
              value={maxExamsPerDay}
              min={1}
              onChange={(event) => setMaxExamsPerDay(Number(event.target.value))}
            />
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
