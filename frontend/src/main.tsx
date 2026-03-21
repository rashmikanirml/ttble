import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UserRoleManagementPage } from "./features/user-role-management/pages/UserRoleManagementPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserRoleManagementPage />
  </StrictMode>,
);
