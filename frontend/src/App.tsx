import { useMemo, useState } from "react";
import { ExamHallResourceManagementPage } from "./features/exam-hall-resource-management/pages/ExamHallResourceManagementPage";
import { ExamTimetableAutoGenerationPage } from "./features/exam-timetable-auto-generation/pages/ExamTimetableAutoGenerationPage";
import { StaffAllocationRepeatProrataPage } from "./features/staff-allocation-repeat-prorata/pages/StaffAllocationRepeatProrataPage";
import { UserRoleManagementPage } from "./features/user-role-management/pages/UserRoleManagementPage";

type NavItem = {
  key: "users" | "timetable" | "halls" | "staff";
  label: string;
};

const navItems: NavItem[] = [
  { key: "users", label: "User & Role" },
  { key: "timetable", label: "Timetable" },
  { key: "halls", label: "Hall & Resource" },
  { key: "staff", label: "Staff & Pro-Rata" },
];

export function App() {
  const [active, setActive] = useState<NavItem["key"]>("users");

  const content = useMemo(() => {
    if (active === "users") {
      return <UserRoleManagementPage />;
    }
    if (active === "timetable") {
      return <ExamTimetableAutoGenerationPage />;
    }
    if (active === "halls") {
      return <ExamHallResourceManagementPage />;
    }
    return <StaffAllocationRepeatProrataPage />;
  }, [active]);

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">TTBLE</div>
        <nav className="nav-links" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === active ? "nav-btn nav-btn-active" : "nav-btn"}
              onClick={() => setActive(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="page-wrap">{content}</div>
    </div>
  );
}
