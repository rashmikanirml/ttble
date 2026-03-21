import { API_BASE } from "../../../lib/api";

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

export async function login(payload: { email: string; password: string }): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({ message: "Login failed" }))) as { message?: string };
    throw new Error(err.message || "Login failed");
  }

  return (await response.json()) as LoginResponse;
}
