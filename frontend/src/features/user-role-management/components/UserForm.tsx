import { FormEvent, useState } from "react";
import type { CreateUserPayload, UserRole } from "../types/models";

type UserFormProps = {
  onCreate: (payload: CreateUserPayload) => Promise<void>;
};

export function UserForm({ onCreate }: UserFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [passwordHash, setPasswordHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"fullName" | "email" | "passwordHash", string>>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    if (fullName.trim().length < 3) {
      setFieldErrors({ fullName: "Full name must be at least 3 characters." });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFieldErrors({ email: "Enter a valid email address." });
      return;
    }

    if (passwordHash.trim().length < 10) {
      setFieldErrors({ passwordHash: "Password must be at least 10 characters." });
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate({ fullName: fullName.trim(), email: email.trim(), passwordHash: passwordHash.trim(), role });
      setFullName("");
      setEmail("");
      setPasswordHash("");
      setRole("student");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <label className="form-field">
        <span className="field-label">Full Name</span>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          className="app-input"
        />
        {fieldErrors.fullName ? <span className="field-error">{fieldErrors.fullName}</span> : null}
      </label>

      <label className="form-field">
        <span className="field-label">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          className="app-input"
        />
        {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
      </label>

      <label className="form-field">
        <span className="field-label">Password</span>
        <input
          value={passwordHash}
          onChange={(event) => setPasswordHash(event.target.value)}
          required
          className="app-input"
          type="password"
        />
        {fieldErrors.passwordHash ? <span className="field-error">{fieldErrors.passwordHash}</span> : null}
      </label>

      <label className="form-field">
        <span className="field-label">Role</span>
        <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="app-select">
          <option value="student">student</option>
          <option value="staff">staff</option>
          <option value="admin">admin</option>
        </select>
      </label>

      <button type="submit" disabled={isSubmitting} className="app-button">
        {isSubmitting ? "Creating..." : "Create user"}
      </button>
    </form>
  );
}
