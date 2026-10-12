import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
      <h1 className="section-title">Page not found</h1>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        The route you requested is not part of Voltaris AI.
      </p>
      <Link to="/" className="btn btn-primary">
        Return home
      </Link>
    </div>
  );
}
