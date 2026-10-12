# Model Card — phaseguard_model.pkl

## Overview

| Field | Value |
|-------|--------|
| Product | Voltaris AI |
| Artifact | `phaseguard_model.pkl` |
| Estimator | `sklearn.ensemble.RandomForestClassifier` |
| Version label | `phaseguard-rf-1.0` |
| Origin | PhaseGuard academic project |

## Features (exact order)

1. `Ia` — Phase A current  
2. `Ib` — Phase B current  
3. `Ic` — Phase C current  
4. `Va` — Phase A voltage (normalized in source data)  
5. `Vb` — Phase B voltage (normalized)  
6. `Vc` — Phase C voltage (normalized)

## Classes

`ABC`, `ABCG`, `ABG`, `AG`, `BC`, `No Fault`

## Dataset

- Source: [Electrical Fault Detection and Classification](https://www.kaggle.com/datasets/esathyaprakash/electrical-fault-detection-and-classification) (Kaggle)
- File: `classData.csv` (~7,861 rows)
- Columns include binary indicators G, C, B, A plus the six continuous features above

## Reported performance (original README — not re-verified here)

- Test accuracy ≈ 86.3%
- Strong performance on No Fault, AG, ABG, BC
- Primary confusion between ABC and ABCG

## Intended use

Educational demonstration of ML-based three-phase fault classification from instantaneous samples. **Not** a protection relay, certified device, or substitute for engineering judgment.

## Limitations

- Six fault types only
- ABC vs ABCG discrimination is limited
- `predict_proba` scores are not calibrated probabilities
- Pickle artifacts are executable; load only trusted files
