import { useCallback, useEffect, useRef, useState } from "react";
import { api, PredictionResponse } from "../services/api";

const DEFAULTS = {
  Ia: 55.5,
  Ib: -1.2,
  Ic: -54.3,
  Va: 0.4,
  Vb: -0.2,
  Vc: -0.2,
};

type Inputs = typeof DEFAULTS;

export function FaultLabPage() {
  const [inputs, setInputs] = useState<Inputs>({ ...DEFAULTS });
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const drawWaveform = useCallback((Ia: number, Ib: number, Ic: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const mid = h / 2;

    ctx.fillStyle = "#fafbf9";
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = "#e9ede8";
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#dce2da";
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();

    const scale = (v: number) => {
      // map ±450 → ±(h/2 - 10)
      const amp = (h / 2 - 10) * (v / 450);
      return Math.max(-(h / 2 - 4), Math.min(h / 2 - 4, amp));
    };

    const phases: { amp: number; phase: number; color: string }[] = [
      { amp: scale(Ia), phase: 0, color: "#bd6656" },
      { amp: scale(Ib), phase: (2 * Math.PI) / 3, color: "#54866c" },
      { amp: scale(Ic), phase: (4 * Math.PI) / 3, color: "#587d9a" },
    ];

    const freq = 0.035;
    for (const p of phases) {
      ctx.beginPath();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const y = mid - p.amp * Math.sin(x * freq + p.phase);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, []);

  const runPredict = useCallback(async (vals: Inputs) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const data = await api.predict(vals);
      if (!ac.signal.aborted) setResult(data);
    } catch (e) {
      if (!ac.signal.aborted) {
        setError(e instanceof Error ? e.message : "Prediction failed");
        setResult(null);
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  const schedulePredict = useCallback(
    (vals: Inputs) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => runPredict(vals), 180);
    },
    [runPredict]
  );

  const update = (key: keyof Inputs, value: number) => {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    if (key === "Ia" || key === "Ib" || key === "Ic") {
      drawWaveform(next.Ia, next.Ib, next.Ic);
    }
    schedulePredict(next);
  };

  const reset = () => {
    setInputs({ ...DEFAULTS });
    drawWaveform(DEFAULTS.Ia, DEFAULTS.Ib, DEFAULTS.Ic);
    runPredict(DEFAULTS);
  };

  useEffect(() => {
    drawWaveform(inputs.Ia, inputs.Ib, inputs.Ic);
    runPredict(inputs);
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confPct = result ? (result.confidence * 100).toFixed(1) : "—";

  return (
    <>
      <h1 className="section-title">Fault Lab</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        Simulated inputs only. Currents approximately ±900; voltages are
        normalized (≈ −0.65…0.65) as in the training dataset. Predictions use
        the original Random Forest model feature contract.
      </p>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.1rem" }}>Inputs</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
              Reset defaults
            </button>
          </div>

          <h3 style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Currents
          </h3>
          {(["Ia", "Ib", "Ic"] as const).map((k) => (
            <div className="slider-row" key={k}>
              <label htmlFor={k}>{k}</label>
              <input
                id={k}
                type="range"
                min={-900}
                max={900}
                step={0.1}
                value={inputs[k]}
                onChange={(e) => update(k, parseFloat(e.target.value))}
              />
              <span className="val">{inputs[k].toFixed(1)}</span>
            </div>
          ))}

          <h3 style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Voltages (normalized)
          </h3>
          {(["Va", "Vb", "Vc"] as const).map((k) => (
            <div className="slider-row" key={k}>
              <label htmlFor={k}>{k}</label>
              <input
                id={k}
                type="range"
                min={-0.65}
                max={0.65}
                step={0.01}
                value={inputs[k]}
                onChange={(e) => update(k, parseFloat(e.target.value))}
              />
              <span className="val">{inputs[k].toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1.1rem" }}>Illustrative current waveform</h2>
          <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}>
            Scaled sine waves from Ia, Ib, Ic only — not measured grid data.
          </p>
          <div className="waveform-wrap">
            <canvas ref={canvasRef} width={600} height={260} aria-label="Three-phase current waveform" />
          </div>
          <div className="legend">
            <span className="a">Phase A</span>
            <span className="b">Phase B</span>
            <span className="c">Phase C</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>
          Model prediction {loading && <span className="muted">(updating…)</span>}
        </h2>
        {error && <div className="alert alert-error">{error}</div>}
        {result && (
          <>
            <div className="result-grid">
              <div className="result-item">
                <div className="label">Fault type</div>
                <div className="value">{result.fault_type}</div>
              </div>
              <div className="result-item">
                <div className="label">Label</div>
                <div className="value" style={{ fontSize: "1rem" }}>
                  {result.fault_label}
                </div>
              </div>
              <div className="result-item">
                <div className="label">Confidence</div>
                <div className="value">{confPct}%</div>
              </div>
              <div className="result-item">
                <div className="label">Model</div>
                <div className="value" style={{ fontSize: "0.95rem" }}>
                  {result.model_version}
                </div>
              </div>
            </div>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              {result.description}
            </p>
            <div className="pills" aria-label="Phase status">
              <span className={`pill ${result.phase_status.A ? "faulted" : "healthy"}`}>
                Phase A: {result.phase_status.A ? "Faulted" : "Healthy"}
              </span>
              <span className={`pill ${result.phase_status.B ? "faulted" : "healthy"}`}>
                Phase B: {result.phase_status.B ? "Faulted" : "Healthy"}
              </span>
              <span className={`pill ${result.phase_status.C ? "faulted" : "healthy"}`}>
                Phase C: {result.phase_status.C ? "Faulted" : "Healthy"}
              </span>
              <span className={`pill ${result.phase_status.ground ? "faulted" : "healthy"}`}>
                Ground: {result.phase_status.ground ? "Faulted" : "Healthy"}
              </span>
            </div>
            <table className="scores-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.class_scores)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cls, score]) => (
                    <tr key={cls}>
                      <td>{cls}</td>
                      <td>{(score * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="disclaimer">{result.disclaimer}</p>
          </>
        )}
      </div>
    </>
  );
}
