import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function TwoFactorChallengePage() {
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "totp") {
        await api.verify2fa(code.trim());
      } else {
        await api.recover2fa(recovery.trim());
      }
      navigate("/lab");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h1 className="section-title">Two-factor authentication</h1>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Enter the 6-digit code from your authenticator app, or use a one-time
        recovery code.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          className={`btn btn-sm ${mode === "totp" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMode("totp")}
        >
          Authenticator code
        </button>
        <button
          type="button"
          className={`btn btn-sm ${mode === "recovery" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMode("recovery")}
        >
          Recovery code
        </button>
      </div>
      <form onSubmit={onSubmit}>
        {mode === "totp" ? (
          <div className="form-group">
            <label htmlFor="totp">Authenticator code</label>
            <input
              id="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={8}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="recovery">Recovery code</label>
            <input
              id="recovery"
              required
              value={recovery}
              onChange={(e) => setRecovery(e.target.value)}
              placeholder="XXXXXXXX"
            />
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}
