import { useEffect, useMemo, useState } from "react";
import { login } from "./features/auth/api/authApi";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { ExamHallResourceManagementPage } from "./features/exam-hall-resource-management/pages/ExamHallResourceManagementPage";
import { ExamTimetableAutoGenerationPage } from "./features/exam-timetable-auto-generation/pages/ExamTimetableAutoGenerationPage";
import { StaffAllocationRepeatProrataPage } from "./features/staff-allocation-repeat-prorata/pages/StaffAllocationRepeatProrataPage";
import { UserRoleManagementPage } from "./features/user-role-management/pages/UserRoleManagementPage";
import { clearAuthToken, getAuthToken, getAuthUser, setAuthToken, setAuthUser } from "./lib/auth";

type NavItem = {
  key: "dashboard" | "users" | "timetable" | "halls" | "staff";
  label: string;
};

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "User & Role" },
  { key: "timetable", label: "Timetable" },
  { key: "halls", label: "Hall & Resource" },
  { key: "staff", label: "Staff & Pro-Rata" },
];

const allowedNavByRole: Record<string, Array<NavItem["key"]>> = {
  admin: ["dashboard", "users", "timetable", "halls", "staff"],
  staff: ["dashboard", "users", "timetable", "halls", "staff"],
  student: ["dashboard", "timetable"],
};

export function App() {
  const [active, setActive] = useState<NavItem["key"]>("dashboard");
  const [email, setEmail] = useState("admin@ttble.local");
  const [password, setPassword] = useState("admin123");
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthToken()));
  const [currentRole, setCurrentRole] = useState(getAuthUser()?.role || "");
  const [error, setError] = useState("");

  const visibleNavItems = useMemo(() => {
    const allowed = allowedNavByRole[currentRole] ?? navItems.map((item) => item.key);
    return navItems.filter((item) => allowed.includes(item.key));
  }, [currentRole]);

  useEffect(() => {
    if (!visibleNavItems.length) {
      return;
    }
    const isActiveAllowed = visibleNavItems.some((item) => item.key === active);
    if (!isActiveAllowed) {
      setActive(visibleNavItems[0].key);
    }
  }, [active, visibleNavItems]);

  async function onLogin() {
    try {
      setError("");
      const result = await login({ email: email.trim(), password: password.trim() });
      setAuthToken(result.token);
      setAuthUser(result.user);
      setIsAuthenticated(true);
      setCurrentRole(result.user.role);
      setActive("dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  }

  function onLogout() {
    clearAuthToken();
    setIsAuthenticated(false);
    setCurrentRole("");
  }

  const content = useMemo(() => {
    if (active === "dashboard") {
      return <DashboardPage currentRole={currentRole} />;
    }
    if (active === "users") {
      return <UserRoleManagementPage />;
    }
    if (active === "timetable") {
      return <ExamTimetableAutoGenerationPage currentRole={currentRole} />;
    }
    if (active === "halls") {
      return <ExamHallResourceManagementPage />;
    }
    return <StaffAllocationRepeatProrataPage />;
  }, [active, currentRole]);

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">TTBLE</div>
        {isAuthenticated ? (
          <>
            <nav className="nav-links" aria-label="Primary navigation">
              {visibleNavItems.map((item) => (
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
            <button type="button" className="nav-btn" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <div className="auth-inline">
            <input className="app-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input className="app-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
            <button type="button" className="app-button" onClick={onLogin}>Sign In</button>
          </div>
        )}
      </header>

      {!isAuthenticated && error ? <div className="auth-error">{error}</div> : null}

      {!isAuthenticated ? (
        <div className="page-wrap">
          <section className="card">
            <h2>Sign In Required</h2>
            <p>Use seeded credentials to enter the management console: admin@ttble.local / admin123</p>
          </section>
        </div>
      ) : null}

      {isAuthenticated ? <div className="page-wrap">{content}</div> : null}
    </div>
  );
}
