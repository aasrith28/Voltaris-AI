import { useEffect, useState } from "react";
import { api, ModelInfo } from "../services/api";

export function ModelInsightsPage() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .modelInfo()
      .then(setInfo)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <>
      <h1 className="section-title">Model Insights</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        Verified metadata from the loaded artifact. Metrics below that are not
        recomputed in this session are labelled as reported.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2 style={{ fontSize: "1.1rem" }}>Loaded model</h2>
        {!info && !error && <p className="muted">Loading…</p>}
        {info && (
          <ul className="feature-list">
            <li>
              Ready: <code>{String(info.ready)}</code>
            </li>
            <li>
              Version: <code>{info.version}</code>
            </li>
            <li>
              Estimator: <code>{info.estimator ?? "—"}</code>
            </li>
            <li>
              Features ({info.n_features ?? "—"}):{" "}
              <code>{info.expected_features.join(", ")}</code>
            </li>
            <li>
              Classes: <code>{(info.classes ?? info.expected_classes).join(", ")}</code>
            </li>
            {info.error && (
              <li>
                Error: <code>{info.error}</code>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Reported evaluation (original project)</h2>
        <p className="muted">
          The following figures come from the original PhaseGuard README and
          have not been independently recomputed in this deployment unless a
          full evaluation pipeline is run against a held-out split:
        </p>
        <ul className="feature-list">
          <li>Reported test accuracy: ~86.3%</li>
          <li>
            Near-perfect precision/recall reported on No Fault, AG, ABG, and BC
          </li>
          <li>Primary confusion: ABC ↔ ABCG</li>
        </ul>
        <p className="disclaimer">
          Do not treat reported accuracy as a newly verified result until the
          evaluation is reproduced with a documented train/test split.
        </p>
      </div>
    </>
  );
}
