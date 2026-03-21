import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createExam,
  createSubject,
  generateTimetable,
  listExams,
  listSubjects,
} from "../api/examTimetableApi";
import type { Exam, ExamSession, Subject } from "../types/models";

export function ExamTimetableAutoGenerationPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [runId, setRunId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

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
  const [createdBy, setCreatedBy] = useState("");

  async function loadData() {
    try {
      setErrorMessage("");
      const [subjectData, examData] = await Promise.all([listSubjects(), listExams()]);
      setSubjects(subjectData);
      setExams(examData);
      if (!examSubjectId && subjectData.length) {
        setExamSubjectId(subjectData[0].id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load data");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function onCreateSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      await createSubject({ code: subjectCode, name: subjectName, yearNo, semesterNo });
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
      await createExam({
        subjectId: examSubjectId,
        examType,
        durationMinutes,
        studentCohort,
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
      const generated = await generateTimetable({
        dateStart,
        dateEnd,
        createdBy,
        maxExamsPerDay,
      });
      setRunId(generated.run.id);
      setSessions(generated.sessions);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate timetable");
    }
  }

  const examIndex = useMemo(() => {
    return new Map(exams.map((exam) => [exam.id, exam]));
  }, [exams]);

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h1>Exam Timetable Auto Generation</h1>
      <p>Define subjects and exams, then generate sessions in a date range.</p>
      {errorMessage ? <p style={{ color: "crimson" }}>{errorMessage}</p> : null}

      <section style={{ marginBottom: 24 }}>
        <h2>Create Subject</h2>
        <form onSubmit={onCreateSubject} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <input value={subjectCode} onChange={(event) => setSubjectCode(event.target.value)} placeholder="Code" required />
          <input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder="Name" required />
          <input
            type="number"
            value={yearNo}
            min={1}
            onChange={(event) => setYearNo(Number(event.target.value))}
            placeholder="Year"
            required
          />
          <input
            type="number"
            value={semesterNo}
            min={1}
            onChange={(event) => setSemesterNo(Number(event.target.value))}
            placeholder="Semester"
            required
          />
          <button type="submit">Add Subject</button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Create Exam</h2>
        <form onSubmit={onCreateExam} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <select value={examSubjectId} onChange={(event) => setExamSubjectId(event.target.value)} required>
            <option value="" disabled>
              Select Subject
            </option>
            {subjects.map((subject) => (
              <option value={subject.id} key={subject.id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>
          <input value={examType} onChange={(event) => setExamType(event.target.value)} placeholder="Exam Type" required />
          <input
            type="number"
            value={durationMinutes}
            min={30}
            step={5}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            placeholder="Duration"
            required
          />
          <input
            value={studentCohort}
            onChange={(event) => setStudentCohort(event.target.value)}
            placeholder="Student Cohort"
            required
          />
          <button type="submit">Add Exam</button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Generate Timetable</h2>
        <form onSubmit={onGenerate} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <label>
            Start Date
            <input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} required />
          </label>
          <label>
            End Date
            <input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} required />
          </label>
          <label>
            Created By (User ID)
            <input value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} required />
          </label>
          <label>
            Max Exams Per Day
            <input
              type="number"
              value={maxExamsPerDay}
              min={1}
              onChange={(event) => setMaxExamsPerDay(Number(event.target.value))}
            />
          </label>
          <button type="submit">Generate</button>
        </form>
      </section>

      <section>
        <h2>Generated Sessions</h2>
        {runId ? <p>Run ID: {runId}</p> : <p>No generated run yet.</p>}
        {!sessions.length ? (
          <p>No sessions generated yet.</p>
        ) : (
          <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse" }}>
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
    </main>
  );
}
