import type { HallBooking, HallWithFacility } from "../types/models";

const API_BASE = "http://localhost:4000/api";

export async function listHalls(): Promise<HallWithFacility[]> {
  const response = await fetch(`${API_BASE}/halls`);
  if (!response.ok) {
    throw new Error("Failed to fetch halls");
  }
  return response.json() as Promise<HallWithFacility[]>;
}

export async function createHall(payload: {
  code: string;
  name: string;
  location: string;
  capacity: number;
}) {
  const response = await fetch(`${API_BASE}/halls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create hall");
  }
  return response.json();
}

export async function upsertHallFacility(
  hallId: string,
  payload: {
    hasAc?: boolean;
    hasComputers?: boolean;
    hasAccessibilitySupport?: boolean;
    hasSpecialNeedsSupport?: boolean;
  },
) {
  const response = await fetch(`${API_BASE}/halls/${hallId}/facilities`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to update hall facilities");
  }
  return response.json();
}

export async function archiveHall(hallId: string) {
  const response = await fetch(`${API_BASE}/halls/${hallId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error("Failed to archive hall");
  }
}

export async function listHallBookings(): Promise<HallBooking[]> {
  const response = await fetch(`${API_BASE}/hall-bookings`);
  if (!response.ok) {
    throw new Error("Failed to fetch hall bookings");
  }
  return response.json() as Promise<HallBooking[]>;
}

export async function createHallBooking(payload: { hallId: string; examSessionId: string }): Promise<HallBooking> {
  const response = await fetch(`${API_BASE}/hall-bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create hall booking");
  }
  return response.json() as Promise<HallBooking>;
}
