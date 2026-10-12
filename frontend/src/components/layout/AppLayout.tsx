import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api } from "../../services/api";

export function AppLayout() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkApi = () => {
      api
        .health()
        .then(() => {
          if (mounted) setApiOnline(true);
        })
        .catch(() => {
          if (mounted) setApiOnline(false);
        });
    };

    checkApi();
    const interval = window.setInterval(checkApi, 15000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="nav">
        <div className="nav-inner">
          <NavLink to="/" className="brand">
            <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden>
              <rect width="32" height="32" rx="9" fill="#183c32" />
              <path
                d="M8 19.5 13 13l4 5 6-8"
                stroke="#d8a448"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="8" cy="19.5" r="1.5" fill="#f7f8f5" />
              <circle cx="23" cy="10" r="1.5" fill="#f7f8f5" />
            </svg>
            <span>Voltaris <span className="brand-light">AI</span></span>
          </NavLink>
          <nav className="nav-links" aria-label="Primary">
            <NavLink to="/" end>
              Overview
            </NavLink>
            <NavLink to="/lab">Fault Lab</NavLink>
            <NavLink to="/insights">Model Insights</NavLink>
            <NavLink to="/methodology">Methodology</NavLink>
            <span
              className={`api-status ${apiOnline === null ? "checking" : apiOnline ? "online" : "offline"}`}
              role="status"
              aria-live="polite"
              title={
                apiOnline === null
                  ? "Checking API connection"
                  : apiOnline
                    ? "API connected"
                    : "API unavailable"
              }
            >
              <span className="api-status-dot" aria-hidden="true" />
              {apiOnline === null ? "Connecting" : apiOnline ? "System online" : "API offline"}
            </span>
            <NavLink to="/login" className="nav-login">
              Sign in
            </NavLink>
            <NavLink to="/register" className="btn-accent">
              Get started
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <strong>Voltaris AI</strong>
            <p>
              Three-phase fault analysis, made easier to understand.
            </p>
            <p className="footer-note">
              An educational software project. Not a protection device.
            </p>
          </div>
          <div className="footer-context">
            <p>
              Built around the PhaseGuard classifier and the Kaggle Electrical
              Fault Detection dataset.
            </p>
            <p>Always defer to qualified engineering judgment.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
