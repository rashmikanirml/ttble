import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ExamTimetableAutoGenerationPage } from "./features/exam-timetable-auto-generation/pages/ExamTimetableAutoGenerationPage";
import { UserRoleManagementPage } from "./features/user-role-management/pages/UserRoleManagementPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div>
      <UserRoleManagementPage />
      <hr style={{ margin: "32px auto", maxWidth: 1100 }} />
      <ExamTimetableAutoGenerationPage />
    </div>
  </StrictMode>,
);
