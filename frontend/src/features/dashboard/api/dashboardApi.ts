import { apiFetch } from "../../../lib/api";

export type DashboardResponse = {
  signedInAs: {
    userId: string;
    role: string;
    email: string;
  };
  kpis: {
    activeUsers: number;
    subjects: number;
    exams: number;
    timetableRuns: number;
    activeHalls: number;
    pendingApplications: number;
  };
};

export function getDashboardKpis(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>("/dashboard/kpis");
}
