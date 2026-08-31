import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const QUICK_FILL = [
  { label: "Admin", email: "admin@ats.dev", role: "SUPER_ADMIN", icon: "🛡️" },
];

export function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const quickFill = (email: string) => {
    setEmail(email);
    setPassword("password");
    setError("");
  };

  return (
    <div className="login-page">
      {/* Aurora background */}
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
      </div>

      {/* Card */}
      <div className={`login-card${shake ? " login-shake" : ""}`}>
        {/* Logo */}
        <div className="login-logo">
          <div className="sidebar-logo-icon" style={{ width: 52, height: 52, fontSize: "1.4rem" }}>A</div>
          <div>
            <h1 className="login-title">ATS</h1>
            <span className="login-subtitle">Applicant Tracking System</span>
          </div>
        </div>

        <div className="login-quickfill">
          <span className="login-quickfill-label">Quick fill</span>
          <div className="login-quickfill-btns">
            {QUICK_FILL.map((q) => (
              <button
                key={q.role}
                id={`quickfill-${q.role.toLowerCase()}`}
                type="button"
                className="login-quickfill-btn"
                onClick={() => quickFill(q.email)}
                title={q.email}
              >
                <span>{q.icon}</span>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form id="login-form" className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-error" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-email" className="login-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="login-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="login-btn-spinner" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="login-footer">
          Powered by <span className="login-footer-accent">AI</span> · Semantic Candidate Matching
        </p>
      </div>
    </div>
  );
}
