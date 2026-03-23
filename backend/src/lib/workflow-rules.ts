export type TimetableStatus = "draft" | "approved" | "published" | "archived" | "active";

const ALLOWED_TRANSITIONS: Record<TimetableStatus, TimetableStatus[]> = {
  draft: ["approved", "archived"],
  approved: ["published", "archived"],
  published: ["archived"],
  archived: [],
  active: ["approved", "archived"],
};

export function canTransitionTimetableStatus(from: TimetableStatus, to: TimetableStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}