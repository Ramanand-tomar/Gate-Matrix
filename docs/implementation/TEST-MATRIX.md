# GATEPrep Studio — Test Matrix (TEST-MATRIX.md)

| Test ID | Phase | Component | Description | Command | Status |
|---|---|---|---|---|---|
| P00-V01 | 00 | Foundation | Package & environment check | `npm run test:unit` | PASSED |
| P00-V02 | 00 | Foundation | Health route & API sanity check | `npm run test:unit` | PASSED |
| P00-V03 | 00 | Safety | Missing emulator fail-closed guard | `npm run test:unit` | PASSED |
| P00-V04 | 00 | Security | No secret exposure in build artifacts | `npm run check:secrets` | PASSED |
| P01-V01 | 01 | Audit | Branch dataset count & 100% inventory reconciliation | `npm run data:audit` | PASSED |
| P02-V01 | 02 | Asset | Base64 recovery & image extraction pipeline | `npm run test:unit` | PASSED |
| P02-V04 | 02 | Security | Script & XSS handler disarming in KaTeX renderer | `npm run test:unit` | PASSED |
| P02-V05 | 02 | Privacy | Solution container & data-correct hint removal | `npm run test:unit` | PASSED |
| P03-V04 | 03 | Migration | Subcollection splitting (qVersions, keys, testVersions) | `npm run test:unit` | PASSED |
| P03-V06 | 03 | Precision | Decimal penalty parsing to rational integer fractions | `npm run test:unit` | PASSED |
| P03-V10 | 03 | Safety | Dry-run migration execution with zero production writes | `npm run data:import:dry-run` | PASSED |
| P04-V05 | 04 | Security | Firestore Rules client deny-by-default for papers/keys | `npm run test:unit` | PASSED |
| P04-V06 | 04 | Privacy | Learner DTO API route excludes keys & solutions | `npm run test:unit` | PASSED |
| P05-V01 | 05 | UI | Catalogue page branch filters & pricing breakdown | `npm run typecheck` | PASSED |
| P05-V02 | 05 | UI | Learner dashboard study workspace & priority tasks | `npm run typecheck` | PASSED |
| P06-V01 | 06 | Engine | Test engine palette, timer & answer state persistence | `npm run typecheck` | PASSED |
| P07-V01 | 07 | Scorer | Golden fixtures for MCQ, MSQ, NAT & rational marks | `npm run test:unit` | PASSED |
| P08-V02 | 08 | Commerce | HMAC-SHA256 signature verification & spoof check | `npm run test:unit` | PASSED |
| P09-V01 | 09 | Analytics | Evidence-based topic mastery signals (<10, <50%, >=80%) | `npm run test:unit` | PASSED |
| P11-V01 | 11 | QA | Integrated vertical pipeline regression | `npm run test:unit` | PASSED |
| P11-V02 | 11 | Build | Next.js production compilation | `npm run build` | PASSED |

---
*Updated: October 2026 — All 21 Tests Verified & PASSED*
