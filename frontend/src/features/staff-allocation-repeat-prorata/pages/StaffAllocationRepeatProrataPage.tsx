import { FormEvent, useEffect, useState } from "react";
import {
  createApplication,
  createAssignment,
  createAvailability,
  decideApplication,
  listApplications,
  listAssignments,
  listAvailability,
} from "../api/staffAllocationApi";
import type {
  RepeatProRataApplication,
  StaffAssignment,
  StaffAvailability,
} from "../types/models";

export function StaffAllocationRepeatProrataPage({ currentRole, currentUserId }: { currentRole: string; currentUserId: string }) {
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [applications, setApplications] = useState<RepeatProRataApplication[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [staffId, setStaffId] = useState("");
  const [availableDate, setAvailableDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  const [assignStaffId, setAssignStaffId] = useState("");
  const [examSessionId, setExamSessionId] = useState("");
  const [roleInSession, setRoleInSession] = useState<"invigilator" | "supervisor" | "LIC" | "support">("invigilator");

  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examId, setExamId] = useState("");
  const [applicationType, setApplicationType] = useState<"repeat" | "pro-rata">("repeat");
  const [reason, setReason] = useState("");

  const [decisionApproverId, setDecisionApproverId] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function loadData() {
    try {
      setErrorMessage("");
      const [a, b, c] = await Promise.all([listAvailability(), listAssignments(), listApplications()]);
      setAvailability(a);
      setAssignments(b);
      setApplications(c);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load component data");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      setDecisionApproverId(currentUserId);
      if (currentRole === "staff") {
        setStaffId(currentUserId);
        setAssignStaffId(currentUserId);
      }
    }
  }, [currentRole, currentUserId]);

  async function onCreateAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      setFieldErrors({});
      if (staffId.trim().length < 6) {
        setFieldErrors({ staffId: "Staff ID must be at least 6 characters." });
        return;
      }
      if (!availableDate) {
        setFieldErrors({ availableDate: "Pick an availability date." });
        return;
      }
      if (startTime >= endTime) {
        setFieldErrors({ endTime: "Availability start time must be earlier than end time." });
        return;
      }

      await createAvailability({ staffId: staffId.trim(), availableDate, startTime, endTime });
      setStaffId("");
      setAvailableDate("");
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create availability");
    }
  }

  async function onCreateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      setFieldErrors({});
      if (examSessionId.trim().length < 8) {
        setFieldErrors({ examSessionId: "Exam Session ID must be at least 8 characters." });
        return;
      }
      if (assignStaffId.trim().length < 6) {
        setFieldErrors({ assignStaffId: "Staff ID must be at least 6 characters." });
        return;
      }

      await createAssignment({ examSessionId: examSessionId.trim(), staffId: assignStaffId.trim(), roleInSession });
      setExamSessionId("");
      setAssignStaffId("");
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create assignment");
    }
  }

  async function onCreateApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      setFieldErrors({});
      if (studentId.trim().length < 6) {
        setFieldErrors({ studentId: "Student ID must be at least 6 characters." });
        return;
      }
      if (!subjectId.trim() && !examId.trim()) {
        setFieldErrors({ subjectId: "Provide at least Subject ID or Exam ID.", examId: "Provide at least Subject ID or Exam ID." });
        return;
      }
      if (reason.trim().length > 0 && reason.trim().length < 6) {
        setFieldErrors({ reason: "Reason must be at least 6 characters when provided." });
        return;
      }

      await createApplication({
        studentId: studentId.trim(),
        subjectId: subjectId.trim() || undefined,
        examId: examId.trim() || undefined,
        applicationType,
        reason: reason.trim() || undefined,
      });
      setStudentId("");
      setSubjectId("");
      setExamId("");
      setReason("");
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create application");
    }
  }

  async function onDecide(applicationId: string, decision: "approved" | "rejected") {
    try {
      setErrorMessage("");
      setFieldErrors({});
      const approverId = (decisionApproverId.trim() || currentUserId.trim());
      if (approverId.length < 8) {
        setFieldErrors({ decisionApproverId: "Approver ID must be at least 8 characters." });
        return;
      }
      await decideApplication(applicationId, {
        approverId,
        decision,
        decisionNote: decisionNote.trim() || undefined,
      });
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update application decision");
    }
  }

  return (
    <main>
      <section className="page-header">
        <h1>Staff Allocation &amp; Repeat/Pro-Rata Management</h1>
        <p>Manage staff availability, assignment constraints, and application approval decisions.</p>
      </section>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <section className="card">
        <h2>Create Staff Availability</h2>
        <form onSubmit={onCreateAvailability} className="form-grid">
          <label className="form-field">
            <span className="field-label">Staff ID</span>
            <input className="app-input" value={staffId} onChange={(event) => setStaffId(event.target.value)} required />
            {fieldErrors.staffId ? <span className="field-error">{fieldErrors.staffId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Available Date</span>
            <input
              className="app-input"
              type="date"
              value={availableDate}
              onChange={(event) => setAvailableDate(event.target.value)}
              required
            />
            {fieldErrors.availableDate ? <span className="field-error">{fieldErrors.availableDate}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Start Time</span>
            <input className="app-input" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
          </label>
          <label className="form-field">
            <span className="field-label">End Time</span>
            <input className="app-input" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
            {fieldErrors.endTime ? <span className="field-error">{fieldErrors.endTime}</span> : null}
          </label>
          <button className="app-button" type="submit">Add Availability</button>
        </form>
      </section>

      <section className="card">
        <h2>Create Staff Assignment</h2>
        <form onSubmit={onCreateAssignment} className="form-grid">
          <label className="form-field">
            <span className="field-label">Exam Session ID</span>
            <input
              className="app-input"
              value={examSessionId}
              onChange={(event) => setExamSessionId(event.target.value)}
              required
            />
            {fieldErrors.examSessionId ? <span className="field-error">{fieldErrors.examSessionId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Staff ID</span>
            <input
              className="app-input"
              value={assignStaffId}
              onChange={(event) => setAssignStaffId(event.target.value)}
              required
            />
            {fieldErrors.assignStaffId ? <span className="field-error">{fieldErrors.assignStaffId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Role In Session</span>
            <select
              className="app-select"
              value={roleInSession}
              onChange={(event) =>
                setRoleInSession(event.target.value as "invigilator" | "supervisor" | "LIC" | "support")
              }
            >
              <option value="invigilator">invigilator</option>
              <option value="supervisor">supervisor</option>
              <option value="LIC">LIC</option>
              <option value="support">support</option>
            </select>
          </label>
          <button className="app-button" type="submit">Assign Staff</button>
        </form>
      </section>

      <section className="card">
        <h2>Create Repeat/Pro-Rata Application</h2>
        <form onSubmit={onCreateApplication} className="form-grid">
          <label className="form-field">
            <span className="field-label">Student ID</span>
            <input
              className="app-input"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              required
            />
            {fieldErrors.studentId ? <span className="field-error">{fieldErrors.studentId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Subject ID (optional)</span>
            <input className="app-input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} />
            {fieldErrors.subjectId ? <span className="field-error">{fieldErrors.subjectId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Exam ID (optional)</span>
            <input className="app-input" value={examId} onChange={(event) => setExamId(event.target.value)} />
            {fieldErrors.examId ? <span className="field-error">{fieldErrors.examId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Application Type</span>
            <select
              className="app-select"
              value={applicationType}
              onChange={(event) => setApplicationType(event.target.value as "repeat" | "pro-rata")}
            >
              <option value="repeat">repeat</option>
              <option value="pro-rata">pro-rata</option>
            </select>
          </label>
          <label className="form-field">
            <span className="field-label">Reason (optional)</span>
            <input className="app-input" value={reason} onChange={(event) => setReason(event.target.value)} />
            {fieldErrors.reason ? <span className="field-error">{fieldErrors.reason}</span> : null}
          </label>
          <button className="app-button" type="submit">Submit Application</button>
        </form>
      </section>

      <section className="card">
        <h2>Decision Inputs</h2>
        <div className="form-grid">
          <label className="form-field">
            <span className="field-label">Approver ID</span>
            <input
              className="app-input"
              value={decisionApproverId}
              onChange={(event) => setDecisionApproverId(event.target.value)}
            />
            {fieldErrors.decisionApproverId ? <span className="field-error">{fieldErrors.decisionApproverId}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Decision Note (optional)</span>
            <input className="app-input" value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} />
          </label>
          <p>Approvals are submitted as the current logged-in user by default.</p>
        </div>
      </section>

      <section className="card">
        <h2>Availability</h2>
        {!availability.length ? (
          <p>No availability entries yet.</p>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th align="left">Staff ID</th>
                <th align="left">Date</th>
                <th align="left">Start</th>
                <th align="left">End</th>
                <th align="left">Status</th>
              </tr>
            </thead>
            <tbody>
              {availability.map((item) => (
                <tr key={item.id}>
                  <td>{item.staffId}</td>
                  <td>{item.availableDate}</td>
                  <td>{item.startTime}</td>
                  <td>{item.endTime}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Assignments</h2>
        {!assignments.length ? (
          <p>No assignments yet.</p>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th align="left">Exam Session</th>
                <th align="left">Staff</th>
                <th align="left">Role</th>
                <th align="left">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item.id}>
                  <td>{item.examSessionId}</td>
                  <td>{item.staffId}</td>
                  <td>{item.roleInSession}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Repeat/Pro-Rata Applications</h2>
        {!applications.length ? (
          <p>No applications yet.</p>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th align="left">Student</th>
                <th align="left">Type</th>
                <th align="left">Status</th>
                <th align="left">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item) => (
                <tr key={item.id}>
                  <td>{item.studentId}</td>
                  <td>{item.applicationType}</td>
                  <td>{item.status}</td>
                  <td>
                    <button
                      type="button"
                      disabled={item.status !== "pending"}
                      onClick={() => onDecide(item.id, "approved")}
                      className="app-button"
                    >
                      Approve
                    </button>{" "}
                    <button
                      type="button"
                      disabled={item.status !== "pending"}
                      onClick={() => onDecide(item.id, "rejected")}
                      className="app-button"
                    >
                      Reject
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
