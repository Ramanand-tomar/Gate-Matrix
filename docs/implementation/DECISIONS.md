# GATEPrep Studio — Architecture & Policy Decisions Log (DECISIONS.md)

## ADR-001: Technology Stack Selection
- **Framework**: Next.js 15+ (App Router, TypeScript)
- **Styling**: Tailwind CSS + Custom CSS Variables (Matching UI Preview aesthetic: `#14213d` Navy, `#0f766e` Teal, `#e7f4f0` Soft background)
- **Backend & Database**: Firebase Firestore (Project ID: `gatematrix-40566`) + Firebase Admin SDK for Server API Routes
- **Authentication**: Firebase Authentication (Google Auth Provider)
- **Testing**: Vitest for unit/integration testing, Testing Library for UI components
- **Math Rendering**: KaTeX / MathML sanitized rendering for math formulas in questions

## ADR-002: Dataset & Security Isolation
- Raw `papers` collection in Firestore contains questions, options, keys, and solutions in single documents.
- **Security Rule**: Learner clients are **DENIED direct client read access** to raw `papers` collection and `answerKeys`.
- **API Projections**: Server API routes project sanitized learner DTOs (`question_html`, `options`) excluding `correct_answer`, `nat_range`, and `solution_html` until test submission.

## ADR-003: Scoring Rules & Rational Profiles
- `MCQ`: Single choice. Standard marking +2 / -0.66 (or -1/3). Explicit source decimal penalties (e.g. `0.66`) stored as `66/100` rational fractions.
- `MSQ`: Multiple select. Full marks for exact set equality. 0 marks for partial selection or extra selections.
- `NAT`: Numerical Answer Type. Exact value match or range match `[low, high]`. No negative marking.

## ADR-004: Entitlement Engine
- **Branch Pass**: Unlocks all current and newly published test series for a specific branch (e.g. CS) during active subscription validity.
- **Subject/Branch Bundle**: Grants access to a fixed list of test items included at purchase time.
