export interface CreateHallDto {
  code: string;
  name: string;
  location: string;
  capacity: number;
}

export interface UpdateHallDto {
  code?: string;
  name?: string;
  location?: string;
  capacity?: number;
  status?: "active" | "inactive";
}

export interface UpsertHallFacilityDto {
  hasAc?: boolean;
  hasComputers?: boolean;
  hasAccessibilitySupport?: boolean;
  hasSpecialNeedsSupport?: boolean;
}

export interface CreateHallBookingDto {
  hallId: string;
  examSessionId: string;
}

export interface UpdateHallBookingDto {
  status?: "booked" | "cancelled";
  hallId?: string;
}
