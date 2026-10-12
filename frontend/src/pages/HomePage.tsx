import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> POWER SYSTEMS · FAULT ANALYSIS</p>
          <h1>When the signal changes, <span>start with clarity.</span></h1>
          <p className="hero-description">
            Explore three-phase electrical faults from six current and voltage
            readings. Adjust the inputs, see what the model notices, and follow
            its reasoning—one signal at a time.
          </p>
          <div className="hero-actions">
            <Link to="/lab" className="btn btn-primary">
              Explore the Fault Lab <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/methodology" className="text-link">
              How it works <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="hero-footnote">
            <span className="footnote-mark" aria-hidden="true">i</span>
            A learning tool—not a substitute for protection equipment.
          </p>
        </div>

        <div className="signal-card">
          <div className="signal-card-heading">
            <div>
              <p className="eyebrow">SIGNAL STUDY <span className="signal-index">/ 01</span></p>
              <h2>A closer look at three phases</h2>
            </div>
            <span className="signal-stamp" aria-label="Illustrative graphic">A·B·C</span>
          </div>
          <div className="wave-illustration">
            <div className="wave-labels" aria-hidden="true">
              <span>+I</span><span>0</span><span>−I</span>
            </div>
            <svg
              viewBox="0 0 560 220"
              role="img"
              aria-label="Illustrative three-phase current waveforms"
              preserveAspectRatio="none"
            >
              <path className="wave-grid-line" d="M0 38H560M0 110H560M0 182H560" />
              <path className="wave-grid-line wave-grid-dash" d="M70 0V220M210 0V220M350 0V220M490 0V220" />
              <path className="wave-trace phase-a" d="M0 110 C23 54 47 22 70 26 S117 86 140 110 S187 194 210 194 S257 134 280 110 S327 26 350 26 S397 86 420 110 S467 194 490 194 S537 134 560 110" />
              <path className="wave-trace phase-b" d="M0 49 C23 22 47 29 70 55 S117 132 140 158 S187 194 210 181 S257 105 280 76 S327 22 350 38 S397 113 420 143 S467 199 490 183 S537 90 560 59" />
              <path className="wave-trace phase-c" d="M0 171 C23 198 47 191 70 165 S117 88 140 62 S187 26 210 39 S257 115 280 144 S327 198 350 182 S397 107 420 77 S467 21 490 37 S537 130 560 161" />
            </svg>
          </div>
          <div className="signal-legend" aria-label="Waveform phases">
            <span><i className="legend-dot phase-a-dot" />Phase A</span>
            <span><i className="legend-dot phase-b-dot" />Phase B</span>
            <span><i className="legend-dot phase-c-dot" />Phase C</span>
          </div>
          <div className="signal-caption">
            <span>Illustrative current waveforms</span>
            <span>Not live measurements</span>
          </div>
        </div>
      </section>

      <section className="overview-strip" aria-label="Model overview">
        <div className="overview-intro">
          <span className="overview-kicker">AT A GLANCE</span>
          <p>A focused view of the essentials.</p>
        </div>
        <div className="overview-stat">
          <span className="overview-number">06</span>
          <span><strong>signal inputs</strong><small>3 currents · 3 voltages</small></span>
        </div>
        <div className="overview-stat">
          <span className="overview-number">06</span>
          <span><strong>fault classes</strong><small>From healthy to three-phase</small></span>
        </div>
        <div className="overview-stat">
          <span className="overview-number overview-word">RF</span>
          <span><strong>Random Forest</strong><small>PhaseGuard model artifact</small></span>
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A SIMPLE WORKFLOW</p>
            <h2>From readings to a result.</h2>
          </div>
          <p>See how each step fits together, from your first input to the final classification.</p>
        </div>
        <div className="workflow-grid">
          <article className="workflow-card">
            <span className="workflow-number">01</span>
            <div className="workflow-icon" aria-hidden="true">↗</div>
            <h3>Set the readings</h3>
            <p>Adjust three phase currents and three normalized voltages in the Fault Lab.</p>
          </article>
          <article className="workflow-card">
            <span className="workflow-number">02</span>
            <div className="workflow-icon" aria-hidden="true">⌁</div>
            <h3>Follow the signal</h3>
            <p>Review an illustrative waveform alongside the values you entered.</p>
          </article>
          <article className="workflow-card">
            <span className="workflow-number">03</span>
            <div className="workflow-icon" aria-hidden="true">✓</div>
            <h3>Read the result</h3>
            <p>Inspect the predicted fault class, phase status, confidence, and class scores.</p>
          </article>
        </div>
      </section>

      <section className="context-panel">
        <div>
          <p className="eyebrow">A NOTE ON THE MODEL</p>
          <h2>Useful for exploration.<br /><span>Honest about its limits.</span></h2>
        </div>
        <div className="context-copy">
          <p>
            The classifier uses an existing PhaseGuard model and preserves its
            original six-feature contract. Reported evaluation figures are
            identified as reported—not presented as freshly verified results.
          </p>
          <Link to="/insights" className="text-link">
            Read the model notes <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
