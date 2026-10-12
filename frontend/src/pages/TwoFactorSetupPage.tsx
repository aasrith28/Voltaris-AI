import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export function TwoFactorSetupPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.setup2fa();
      setSecret(res.secret);
      setQr(res.qr_code_base64);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  const activate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.activate2fa(code.trim());
      setRecoveryCodes(res.codes);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card" style={{ maxWidth: 480 }}>
      <h1 className="section-title">Set up authenticator</h1>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Scan the QR code with an authenticator app (Google Authenticator,
        Authy, etc.), then enter a code to activate two-factor authentication.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      {message && !recoveryCodes && (
        <div className="alert alert-info">{message}</div>
      )}
      {!secret && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={startSetup}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate QR code"}
        </button>
      )}
      {qr && (
        <div style={{ textAlign: "center", margin: "1rem 0" }}>
          <img
            src={`data:image/png;base64,${qr}`}
            alt="TOTP QR code"
            width={200}
            height={200}
            style={{ borderRadius: 8, background: "#fff", padding: 8 }}
          />
          {secret && (
            <p className="muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Manual key: <code>{secret}</code>
            </p>
          )}
        </div>
      )}
      {secret && !recoveryCodes && (
        <form onSubmit={activate}>
          <div className="form-group">
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              inputMode="numeric"
              required
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Activating…" : "Activate 2FA"}
          </button>
        </form>
      )}
      {recoveryCodes && (
        <div className="alert alert-success">
          <p style={{ marginBottom: "0.5rem" }}>{message}</p>
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
            Store these recovery codes securely — each works only once:
          </p>
          <ul style={{ fontFamily: "var(--mono)", fontSize: "0.9rem" }}>
            {recoveryCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p style={{ marginTop: "0.75rem" }}>
            <Link to="/lab">Continue to Fault Lab</Link>
          </p>
        </div>
      )}
    </div>
  );
}
