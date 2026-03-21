import type { CreateUserPayload, UpdateUserPayload, User } from "../types/models";
import { apiFetch } from "../../../lib/api";

export async function listUsers(): Promise<User[]> {
  return apiFetch<User[]>("/users");
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  return apiFetch<User>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<User> {
  return apiFetch<User>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateUser(userId: string): Promise<void> {
  await apiFetch<void>(`/users/${userId}`, {
    method: "DELETE",
  });
}
