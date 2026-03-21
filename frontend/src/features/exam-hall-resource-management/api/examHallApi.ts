import type { HallBooking, HallWithFacility } from "../types/models";
import { apiFetch } from "../../../lib/api";

export async function listHalls(): Promise<HallWithFacility[]> {
  return apiFetch<HallWithFacility[]>("/halls");
}

export async function createHall(payload: {
  code: string;
  name: string;
  location: string;
  capacity: number;
}) {
  return apiFetch("/halls", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
  return apiFetch(`/halls/${hallId}/facilities`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function archiveHall(hallId: string) {
  await apiFetch<void>(`/halls/${hallId}`, { method: "DELETE" });
}

export async function listHallBookings(): Promise<HallBooking[]> {
  return apiFetch<HallBooking[]>("/hall-bookings");
}

export async function createHallBooking(payload: { hallId: string; examSessionId: string }): Promise<HallBooking> {
  return apiFetch<HallBooking>("/hall-bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
