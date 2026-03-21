import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ExamHallResourceManagementPage } from "./features/exam-hall-resource-management/pages/ExamHallResourceManagementPage";
import { ExamTimetableAutoGenerationPage } from "./features/exam-timetable-auto-generation/pages/ExamTimetableAutoGenerationPage";
import { StaffAllocationRepeatProrataPage } from "./features/staff-allocation-repeat-prorata/pages/StaffAllocationRepeatProrataPage";
import { UserRoleManagementPage } from "./features/user-role-management/pages/UserRoleManagementPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div>
      <UserRoleManagementPage />
      <hr style={{ margin: "32px auto", maxWidth: 1100 }} />
      <ExamTimetableAutoGenerationPage />
      <hr style={{ margin: "32px auto", maxWidth: 1100 }} />
      <ExamHallResourceManagementPage />
      <hr style={{ margin: "32px auto", maxWidth: 1100 }} />
      <StaffAllocationRepeatProrataPage />
    </div>
  </StrictMode>,
);
