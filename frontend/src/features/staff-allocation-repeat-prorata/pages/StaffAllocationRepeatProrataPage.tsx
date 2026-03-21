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

export function StaffAllocationRepeatProrataPage() {
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

  async function onCreateAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      await createAvailability({ staffId, availableDate, startTime, endTime });
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
      await createAssignment({ examSessionId, staffId: assignStaffId, roleInSession });
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
      await createApplication({
        studentId,
        subjectId: subjectId || undefined,
        examId: examId || undefined,
        applicationType,
        reason: reason || undefined,
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
      await decideApplication(applicationId, {
        approverId: decisionApproverId,
        decision,
        decisionNote: decisionNote || undefined,
      });
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update application decision");
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h1>Staff Allocation &amp; Repeat/Pro-Rata Management</h1>
      <p>Manage availability, assignments, and student repeat/pro-rata application decisions.</p>
      {errorMessage ? <p style={{ color: "crimson" }}>{errorMessage}</p> : null}

      <section style={{ marginBottom: 24 }}>
        <h2>Create Staff Availability</h2>
        <form onSubmit={onCreateAvailability} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <input value={staffId} onChange={(event) => setStaffId(event.target.value)} placeholder="Staff ID" required />
          <input
            type="date"
            value={availableDate}
            onChange={(event) => setAvailableDate(event.target.value)}
            required
          />
          <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
          <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
          <button type="submit">Add Availability</button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Create Staff Assignment</h2>
        <form onSubmit={onCreateAssignment} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <input
            value={examSessionId}
            onChange={(event) => setExamSessionId(event.target.value)}
            placeholder="Exam Session ID"
            required
          />
          <input
            value={assignStaffId}
            onChange={(event) => setAssignStaffId(event.target.value)}
            placeholder="Staff ID"
            required
          />
          <select
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
          <button type="submit">Assign Staff</button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Create Repeat/Pro-Rata Application</h2>
        <form onSubmit={onCreateApplication} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <input
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="Student ID"
            required
          />
          <input value={subjectId} onChange={(event) => setSubjectId(event.target.value)} placeholder="Subject ID (optional)" />
          <input value={examId} onChange={(event) => setExamId(event.target.value)} placeholder="Exam ID (optional)" />
          <select
            value={applicationType}
            onChange={(event) => setApplicationType(event.target.value as "repeat" | "pro-rata")}
          >
            <option value="repeat">repeat</option>
            <option value="pro-rata">pro-rata</option>
          </select>
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" />
          <button type="submit">Submit Application</button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Decision Inputs</h2>
        <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <input
            value={decisionApproverId}
            onChange={(event) => setDecisionApproverId(event.target.value)}
            placeholder="Approver ID"
          />
          <input value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Decision Note" />
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Availability</h2>
        {!availability.length ? (
          <p>No availability entries yet.</p>
        ) : (
          <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse" }}>
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

      <section style={{ marginBottom: 24 }}>
        <h2>Assignments</h2>
        {!assignments.length ? (
          <p>No assignments yet.</p>
        ) : (
          <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse" }}>
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

      <section>
        <h2>Repeat/Pro-Rata Applications</h2>
        {!applications.length ? (
          <p>No applications yet.</p>
        ) : (
          <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse" }}>
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
                      disabled={item.status !== "pending" || !decisionApproverId}
                      onClick={() => onDecide(item.id, "approved")}
                    >
                      Approve
                    </button>{" "}
                    <button
                      type="button"
                      disabled={item.status !== "pending" || !decisionApproverId}
                      onClick={() => onDecide(item.id, "rejected")}
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
