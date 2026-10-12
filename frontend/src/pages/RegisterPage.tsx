import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevToken(null);
    try {
      const res = await api.register(email, password, fullName || undefined);
      setMessage(res.message);
      if (res.dev_verification_token) {
        setDevToken(res.dev_verification_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyDev = async () => {
    if (!devToken) return;
    try {
      const res = await api.verifyEmail(devToken);
      setMessage(res.message);
      setDevToken(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    }
  };

  return (
    <div className="card auth-card">
      <h1 className="section-title">Register</h1>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Password requirements: at least 10 characters, upper and lower case,
        and a digit. Email verification is required before login. Then enroll
        authenticator TOTP.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      {devToken && (
        <div className="alert alert-info">
          Development verification token issued (console email mode).{" "}
          <button type="button" className="btn btn-ghost btn-sm" onClick={verifyDev}>
            Verify now
          </button>
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full name (optional)</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
