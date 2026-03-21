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
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    if (fullName.trim().length < 3) {
      setValidationError("Full name must be at least 3 characters.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setValidationError("Enter a valid email address.");
      return;
    }

    if (passwordHash.trim().length < 10) {
      setValidationError("Password hash must be at least 10 characters.");
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
      {validationError ? <div className="error-banner">{validationError}</div> : null}
      <input
        placeholder="Full name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        required
        className="app-input"
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        type="email"
        className="app-input"
      />
      <input
        placeholder="Password hash"
        value={passwordHash}
        onChange={(event) => setPasswordHash(event.target.value)}
        required
        className="app-input"
      />
      <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="app-select">
        <option value="student">student</option>
        <option value="staff">staff</option>
        <option value="admin">admin</option>
      </select>
      <button type="submit" disabled={isSubmitting} className="app-button">
        {isSubmitting ? "Creating..." : "Create user"}
      </button>
    </form>
  );
}
