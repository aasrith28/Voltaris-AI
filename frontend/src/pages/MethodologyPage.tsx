export function MethodologyPage() {
  return (
    <>
      <h1 className="section-title">Methodology</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        How Voltaris AI maps six electrical features to a fault class.
      </p>

      <div className="card">
        <h2 style={{ fontSize: "1.1rem" }}>Feature contract</h2>
        <p className="muted">
          The classifier expects exactly six numeric features in this order:
        </p>
        <ul className="feature-list">
          <li>
            <code>Ia, Ib, Ic</code> — phase currents (training range roughly
            −900…900)
          </li>
          <li>
            <code>Va, Vb, Vc</code> — phase voltages as provided by the source
            dataset (normalized, roughly −0.65…0.65)
          </li>
        </ul>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Feature order and units are preserved from the original PhaseGuard
          model. No silent reordering or unit conversion is applied.
        </p>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Classes</h2>
        <ul className="feature-list">
          <li>
            <code>No Fault</code> — healthy operation
          </li>
          <li>
            <code>AG</code> — Line A to Ground
          </li>
          <li>
            <code>ABG</code> — Lines A, B to Ground
          </li>
          <li>
            <code>BC</code> — Line B to Line C
          </li>
          <li>
            <code>ABC</code> — Three-phase (no ground)
          </li>
          <li>
            <code>ABCG</code> — Three-phase to Ground
          </li>
        </ul>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          ABC and ABCG share highly symmetric signatures; the original project
          reported most residual error between these two classes.
        </p>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Inference vs conventional analysis</h2>
        <p className="muted">
          Machine-learning inference produces a class label and score vector
          from instantaneous samples. It does not implement protection relay
          logic, sequence-component analysis, or impedance-based fault location.
          Phase/ground status in the UI is a deterministic mapping from the
          predicted label, not an independent electrical measurement.
        </p>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Dataset</h2>
        <p className="muted">
          Training data: Electrical Fault Detection and Classification
          (Kaggle, esathyaprakash) — <code>classData.csv</code> with columns G,
          C, B, A, Ia, Ib, Ic, Va, Vb, Vc (~7,861 rows). Labels in the CSV are
          encoded via binary indicators G/C/B/A; the shipped model exposes the
          six string class names listed above.
        </p>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Limitations</h2>
        <ul className="feature-list">
          <li>Six fault types only; not exhaustive of all fault combinations</li>
          <li>ABC vs ABCG discrimination is inherently limited with these features</li>
          <li>
            Slider inputs approximate continuous values; dataset samples are
            higher precision
          </li>
          <li>
            Class scores from <code>predict_proba</code> are not calibrated
            probabilities
          </li>
          <li>Educational software — not a certified protection device</li>
        </ul>
      </div>
    </>
  );
}
