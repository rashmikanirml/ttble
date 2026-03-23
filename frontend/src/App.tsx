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
  const [currentUserId, setCurrentUserId] = useState(getAuthUser()?.id || "");
  const [currentRole, setCurrentRole] = useState(getAuthUser()?.role || "");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      setFieldErrors({});
      if (!email.trim()) {
        setFieldErrors({ email: "Email is required." });
        return;
      }
      if (!password.trim()) {
        setFieldErrors({ password: "Password is required." });
        return;
      }
      const result = await login({ email: email.trim(), password: password.trim() });
      setAuthToken(result.token);
      setAuthUser(result.user);
      setIsAuthenticated(true);
      setCurrentUserId(result.user.id);
      setCurrentRole(result.user.role);
      setActive("dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  }

  function onLogout() {
    clearAuthToken();
    setIsAuthenticated(false);
    setCurrentUserId("");
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
      return <ExamTimetableAutoGenerationPage currentRole={currentRole} currentUserId={currentUserId} />;
    }
    if (active === "halls") {
      return <ExamHallResourceManagementPage />;
    }
    return <StaffAllocationRepeatProrataPage currentRole={currentRole} currentUserId={currentUserId} />;
  }, [active, currentRole, currentUserId]);

  return (
    <div className="app-shell">
      <div className="bubble-layer" aria-hidden="true">
        <span className="bubble" style={{ ["--size" as string]: "72px", ["--left" as string]: "4%", ["--duration" as string]: "20s", ["--delay" as string]: "-2s" }} />
        <span className="bubble" style={{ ["--size" as string]: "52px", ["--left" as string]: "14%", ["--duration" as string]: "15s", ["--delay" as string]: "-8s" }} />
        <span className="bubble" style={{ ["--size" as string]: "86px", ["--left" as string]: "24%", ["--duration" as string]: "22s", ["--delay" as string]: "-6s" }} />
        <span className="bubble" style={{ ["--size" as string]: "42px", ["--left" as string]: "33%", ["--duration" as string]: "14s", ["--delay" as string]: "-1s" }} />
        <span className="bubble" style={{ ["--size" as string]: "90px", ["--left" as string]: "44%", ["--duration" as string]: "24s", ["--delay" as string]: "-10s" }} />
        <span className="bubble" style={{ ["--size" as string]: "60px", ["--left" as string]: "58%", ["--duration" as string]: "18s", ["--delay" as string]: "-3s" }} />
        <span className="bubble" style={{ ["--size" as string]: "74px", ["--left" as string]: "67%", ["--duration" as string]: "20s", ["--delay" as string]: "-12s" }} />
        <span className="bubble" style={{ ["--size" as string]: "48px", ["--left" as string]: "76%", ["--duration" as string]: "16s", ["--delay" as string]: "-5s" }} />
        <span className="bubble" style={{ ["--size" as string]: "96px", ["--left" as string]: "86%", ["--duration" as string]: "25s", ["--delay" as string]: "-7s" }} />
        <span className="bubble" style={{ ["--size" as string]: "56px", ["--left" as string]: "94%", ["--duration" as string]: "17s", ["--delay" as string]: "-11s" }} />
      </div>
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
            <label className="form-field">
              <span className="field-label">Email</span>
              <input className="app-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
            </label>
            <label className="form-field">
              <span className="field-label">Password</span>
              <input className="app-input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
              {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
            </label>
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
