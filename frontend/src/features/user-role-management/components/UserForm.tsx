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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onCreate({ fullName, email, passwordHash, role });
      setFullName("");
      setEmail("");
      setPasswordHash("");
      setRole("student");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
      <input
        placeholder="Full name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        required
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        type="email"
      />
      <input
        placeholder="Password hash"
        value={passwordHash}
        onChange={(event) => setPasswordHash(event.target.value)}
        required
      />
      <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
        <option value="student">student</option>
        <option value="staff">staff</option>
        <option value="admin">admin</option>
      </select>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create user"}
      </button>
    </form>
  );
}
