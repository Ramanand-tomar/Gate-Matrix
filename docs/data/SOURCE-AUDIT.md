# Phase 01 — Source Dataset Audit & Inventory Report (SOURCE-AUDIT.md)

**Audit Execution Date**: October 2026  
**Status**: PASSED (100% Reconciliation)

## 1. Verified Inventory Summary

| Branch Code | Branch Name | Scraped JSON Files | Total Questions Parsed |
|:---:|:---|---:|---:|
| `CE` | CIVIL_ENGINEERING | 84 | 4,005 |
| `CS` | COMPUTER_SCIENCE_ENGINEERING | 467 | 3,168 |
| `DA` | DATA_SCIENCE_AND_ARTIFICIAL_INTELLIGENCE | 77 | 2,741 |
| `EE` | ELECTRICAL_ENGINEERING | 238 | 4,755 |
| `EC` | ELECTRONICS_ENGINEERING | 98 | 3,383 |
| `ME` | MECHANICAL_ENGINEERING | 97 | 3,318 |
| **Total** | **6 Branches** | **1,061 Papers** | **21,370 Questions** |

- **Reported Question Total**: 21,370
- **Parsed Question Total**: 21,370
- **Reconciliation Delta**: 0 (Exact Match)

## 2. Question Type Distribution

| Question Type | Description | Count | Percentage |
|:---:|:---|---:|---:|
| **MCQ** | Multiple Choice Questions | 13,477 | 63.06% |
| **NAT** | Numerical Answer Type Questions | 5,803 | 27.15% |
| **MSQ** | Multiple Select Questions | 2,090 | 9.78% |
| **UNKNOWN** | Unclassified / Malformed | 0 | 0.00% |

## 3. Field Audit Findings & Schema Adaptation
- **`qnum`**: Paper-local identifier (1 to 65). Must not be used as a global database key.
- **Base64 Assets**: Base64 data URLs exist in `question_html` and `solution_html`. Stripped in raw cloud uploads to maintain Firestore document limit (~1MB). Original base64 binaries preserved in local `scraped_dataset/` files.
- **Options Grammar**: Options stored as key-value maps (`A`, `B`, `C`, `D`) with text and HTML fields.
- **Scoring & Penalties**:
  - `MCQ`: Single correct option. Positive: 1.0 or 2.0. Negative: `-0.33` or `-0.66` (stored as exact rational fractions `33/100` and `66/100`).
  - `MSQ`: Set of correct options (e.g. `"A,C"`). Positive: 1.0 or 2.0. Negative: 0.0 (No negative marking).
  - `NAT`: Exact answer or range `{ low, high }`. Negative: 0.0.
