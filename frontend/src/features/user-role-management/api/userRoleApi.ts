import type { CreateUserPayload, UpdateUserPayload, User } from "../types/models";

const API_BASE = "http://localhost:4000/api";

export async function listUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE}/users`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json() as Promise<User[]>;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create user");
  }

  return response.json() as Promise<User>;
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<User> {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update user");
  }

  return response.json() as Promise<User>;
}

export async function deactivateUser(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to deactivate user");
  }
}
