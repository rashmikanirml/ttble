export interface Hall {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
  status: "active" | "inactive";
}

export interface HallFacility {
  hallId: string;
  hasAc: boolean;
  hasComputers: boolean;
  hasAccessibilitySupport: boolean;
  hasSpecialNeedsSupport: boolean;
}

export interface HallWithFacility extends Hall {
  facilities: HallFacility | null;
}

export interface HallBooking {
  id: string;
  hallId: string;
  examSessionId: string;
  status: "booked" | "cancelled";
}
