export interface Hall {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface HallFacility {
  hallId: string;
  hasAc: boolean;
  hasComputers: boolean;
  hasAccessibilitySupport: boolean;
  hasSpecialNeedsSupport: boolean;
  updatedAt: string;
}

export interface HallBooking {
  id: string;
  hallId: string;
  examSessionId: string;
  status: "booked" | "cancelled";
  createdAt: string;
  updatedAt: string;
}
