import { useEffect, useState } from "react";
import { createUser, deactivateUser, listUsers } from "../api/userRoleApi";
import { UserForm } from "../components/UserForm";
import { UserTable } from "../components/UserTable";
import type { CreateUserPayload, User } from "../types/models";

export function UserRoleManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function loadUsers() {
    try {
      setErrorMessage("");
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load users");
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleCreate(payload: CreateUserPayload) {
    try {
      setErrorMessage("");
      await createUser(payload);
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create user");
    }
  }

  async function handleDeactivate(userId: string) {
    try {
      setErrorMessage("");
      await deactivateUser(userId);
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to deactivate user");
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h1>User &amp; Role Management</h1>
      <p>Create users and manage activation state.</p>
      {errorMessage ? <p style={{ color: "crimson" }}>{errorMessage}</p> : null}
      <UserForm onCreate={handleCreate} />
      <UserTable users={users} onDeactivate={handleDeactivate} />
    </main>
  );
}
