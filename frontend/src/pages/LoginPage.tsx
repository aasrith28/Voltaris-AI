import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.login(email, password);
      if (res.requires_2fa) {
        navigate("/2fa");
        return;
      }
      if (res.requires_2fa_setup) {
        setMessage(
          "Authenticated. Please enroll two-factor authentication to secure your account."
        );
        setTimeout(() => navigate("/2fa/setup"), 800);
        return;
      }
      setMessage((res.message as string) || "Authenticated");
      navigate("/lab");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h1 className="section-title">Log in</h1>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        After password verification, authenticator TOTP is required when 2FA is
        enabled. Sessions use HTTP-only cookies.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        No account? <Link to="/register">Register</Link>
      </p>
      <div className="login-credit">VYOMANT-TECHNOLOGIES <span aria-hidden="true">·</span></div>
    </div>
  );
}
