# Phase 03 — Schema Normalization & Migration Report (MIGRATION-REPORT.md)

**Status**: PASSED  
**Execution Date**: October 2026  
**Dry-Run Script**: `npm run data:import:dry-run`  

## 1. Schema Transformation Strategy
- **Raw `papers` Source**: Preserved as restricted read-only reference.
- **Normalized Subcollections**:
  1. `questionVersions`: Learner-facing presentation objects (`qvid`, `qnum`, `qtype`, `questionHtml`, `options`, `tags`).
  2. `answerKeys`: Private server scoring objects (`qvid`, `qtype`, `correctOptions`, `natRange`, `marksPositive`, `marksNegativeRational`, `solutionHtml`).
  3. `testVersions`: Test manifest & item sequence (`testId`, `title`, `branchCode`, `provider`, `items[]`).

## 2. Rational Penalties & Decimal Precision
- Negative marks (e.g. `"0.66"`) stored as explicit rational numerators and denominators (`num: 66, den: 100`) to prevent floating-point rounding errors during scoring.
- NAT ranges parsed into numerical intervals `{ low, high }`.

## 3. Verification Gate Summary
- `P03-V04`: Split questionVersions, answerKeys, and testVersions. (PASSED)
- `P03-V06`: Decimal penalty parsing into rational fractions. (PASSED)
- `P03-V10`: Dry-run mode with zero writes to production database. (PASSED)
