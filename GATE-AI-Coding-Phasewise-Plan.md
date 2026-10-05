# GATE platform phasewise implementation and testing plan

Version 1.1 | 4 October 2026 | For an AI coding assistant and human reviewer

## 1 Purpose and precedence

Build the GATE preparation website described in the existing PRD using the owner's actual scraped-paper schema. This document turns the PRD into ordered implementation tasks, test cases and phase exit gates. It is an execution specification, not a report that implementation or database tests have already passed.

Use this alongside the eight PRD specifications already provided. This document supersedes earlier uncertainty about the database type and source format: the owner now identifies Cloud Firestore project `gatematrix-40566`, source collection `papers`, and the schema below. The existing commerce policy remains: an active branch pass includes newly released eligible series in that branch; an ordinary bundle purchase covers its purchased manifest. Prices and durations in the original PRD remain proposals.

No source JSON, scraper code, uploader code, repository or database connection has been inspected while writing this plan. The supplied schema is authoritative as a description; actual field variations, permissions and content quality must be measured in Phase 01. A project ID is not permission to alter production. For this planning request, no Firebase reads or writes were performed.

**Main development order:** inspect → preserve source → recover assets → normalize/version → secure identity/access → catalogue → attempts → scoring → commerce → analysis → admin → regression → controlled release.

## 2 Confirmed inputs and required adaptations

### Dataset inventory

| Source directory | Application branch code | Reported papers |
| --- | --- | ---: |
| `COMPUTER_SCIENCE_ENGINEERING` | `CS` | 467 |
| `DATA_SCIENCE_AND_ARTIFICIAL_INTELLIGENCE` | `DA` | 77 |
| `CIVIL_ENGINEERING` | `CE` | 84 |
| `ELECTRICAL_ENGINEERING` | `EE` | 238 |
| `ELECTRONICS_ENGINEERING` | `EC` | 98 |
| `MECHANICAL_ENGINEERING` | `ME` | 97 |
| Total | | 1,061 |

Reported question total: 21,370. Maintain separate totals for source question occurrences and canonical unique questions. These must not be conflated after deduplication. Preserve raw branch labels and confirm the electronics-to-EC mapping during audit.

Local source: `scraped_dataset/`. Named utilities: `dvruo_paper_scraper.py` and `upload_to_firebase.py`. The scraper reportedly parses `.qcard` records and a `window.__SERIES_MANIFEST__` manifest. Treat supplied scripts as code to inspect, not commands to execute automatically; running the scraper could make external requests, and running the uploader could overwrite source documents.

### Existing source schema

Paper fields: `title`, `branch`, `provider`, `series`, `file_name`, `total_questions`, `questions[]`.

Question fields: `qnum`, `qtype`, `correct_answer`, `nat_range`, `marks`, `tags`, `question_text`, `question_html`, `question_images`, `options`, `answer_text`, `solution_text`, `solution_html`, `solution_images`.

`marks` contains decimal strings `positive` and `negative`. `nat_range` is null or `{low, high}` with decimal strings. `options` maps source labels such as A–D to objects containing text and HTML. `correct_answer` is a string whose actual MSQ delimiters must be discovered. Images may be base64 values or paths; rich HTML may reference additional images not listed in the arrays.

### Key changes from generic PRD assumptions

| Observed schema characteristic | Required implementation decision |
| --- | --- |
| Questions, keys and solutions share one source document | Make `papers` an internal source; serve only explicit allowlisted API projections |
| Base64 content was stripped during upload | Audit local-versus-cloud asset loss; missing diagrams block affected content publication |
| One document contains a complete paper | Normalize into bounded versioned documents and test-item subcollections for production serving |
| Question number is only local to a paper | Use stable source identity and separate test item IDs; never use `qnum` as a global ID |
| Rich HTML contains provider-specific markup | Normalize and sanitize HTML/math while stripping answer-revealing presentation |
| `tags` is an unstructured string | Preserve raw tags and map to reviewed subject/topic/difficulty fields |
| Provider `series` is a cohort label | Preserve as source metadata; do not equate it to a sellable product or entitlement |
| Duration, sections, taxonomy and validity are absent | Add reviewed metadata; do not infer silently from titles |
| Example negative mark is `0.66` | Preserve raw decimal; apply explicit reviewed scoring profile, never silently convert |
| Provider names are present | Keep provenance; record publishing eligibility separately; do not imply partnership |

## 3 Operating contract for the coding assistant

1. Read repository instructions, the PRD and this plan before editing. Reuse existing architecture where practical; record necessary deviations.
2. Start at the earliest incomplete phase whose dependencies are satisfied. Complete its tasks and relevant tests before moving to dependent phases. Routine successful gates do not require repeated user confirmation.
3. Make small, reviewable changes. Reuse the project's package manager, framework and test runner. Pin compatible versions after checking official documentation; do not change stacks just to follow illustrative filenames.
4. Default to emulators and a separate staging project. Production database access is read-only until the implementation session explicitly authorizes a concrete migration/release. Never overwrite or delete existing `papers` as part of experimentation.
5. Do not print, commit or request service-account JSON in chat. Use available approved credential mechanisms and verify the target project/database explicitly. An active Firebase CLI login does not itself prove that a Python script has valid Application Default Credentials; inspect the uploader's real authentication path.
6. Keep source exports, raw solutions and private fixtures outside public assets and client bundles. Never use a client-side `isPaid` flag or obscured UI as authorization.
7. Tests must verify behavior and adverse cases, not simply reproduce implementation details. Do not mark a missing browser/emulator/provider test as passed. Fix failures in the current scope and rerun affected tests.
8. Stop the affected dependency chain when a required gate fails. Continue unrelated useful work with synthetic fixtures. For missing real data, mark data-backed verification BLOCKED and name the exact input needed. Do not repeatedly ask for the same missing access.
9. No silent test deletion, skipped security suite, fabricated payment, invented answer key, generated missing diagram or unsupported claim of 100% scraping prevention.
10. At each gate, update the progress file and produce a short report with changed paths, commands, outcomes, blockers and the next phase. Do not auto-send user/customer communications.

### Status vocabulary

`NOT_STARTED`, `IN_PROGRESS`, `PASSED`, `FAILED`, `BLOCKED`, `DEFERRED`.

All phases start as NOT_STARTED. A phase with unavailable mandatory verification is BLOCKED, even if code is written. DEFERRED applies only to explicitly optional features, never core access, scoring, migration or payment safety checks.

### Required working artifacts inside the implementation repository

These are files the coding assistant should create during development, not files claimed to exist now:

- `docs/implementation/PROGRESS.md`: task/phase status and evidence links.
- `docs/implementation/DECISIONS.md`: schema, scoring profile and policy decisions.
- `docs/implementation/TEST-MATRIX.md`: test IDs, fixture, command and result.
- `docs/implementation/reports/phase-XX.md`: phase completion report.
- `docs/data/SOURCE-AUDIT.md`, `FIELD-MAPPING.md`, `ASSET-AUDIT.md`, `MIGRATION-REPORT.md`.
- `tests/fixtures/`: small synthetic/authorized fixtures; no entire premium dataset in git.
- `scripts/data/`: read-only audit, normalizer, dry-run and staging import tools.

## 4 Phase map and PRD mapping

| Phase | Deliverable | Depends on | Main PRD sections |
| --- | --- | --- | --- |
| 00 | Repository and test foundation | None | Architecture; delivery |
| 01 | Source audit and field mapping | 00 | Data/API; product taxonomy |
| 02 | Safe HTML, math and asset pipeline | 01 | UX; security; import workflow |
| 03 | Normalized staging dataset and migration | 01–02 | Data/API; versioning |
| 04 | Google identity and access boundary | 00, 03 contracts | Security; commerce policy |
| 05 | Public catalogue and learner UI | 03–04 | Product journeys; design system |
| 06 | Attempt engine and recovery | 04–05 | Test engine |
| 07 | Trusted scoring and solution review | 03–04, 06 | Scoring; results |
| 08 | Payments, bundles and branch passes | 04–07 | Commerce and entitlements |
| 09 | Topic analysis and next practice | 07–08 | Learning analytics |
| 10 | Admin, imports and new-series release | 03–04, 08–09 | Admin; publication; finance |
| 11 | Integrated QA and release candidate | 00–10 | Acceptance and operations |
| 12 | Approved deployment and live smoke | 11 | Release and recovery |

This is the detailed execution order; it expands the earlier seven broad delivery phases. No calendar promise is attached. Data review and asset recovery may be the longest dependencies.

## Phase 00 — Repository and testing foundation

**Outcome:** a runnable local application and trustworthy verification tooling before feature development.

### Tasks

- [ ] P00-T01 Inspect repository instructions, current framework, package manager, dependencies, existing tests and environment files. Record what already works.
- [ ] P00-T02 Confirm local, emulator, staging and production target configuration. Fail startup/import scripts when a writable target is unspecified. Tests must not fall back to production.
- [ ] P00-T03 Establish server-only Firebase Admin initialization and client-only Google Auth initialization. Create `.env.example` with names, never secrets.
- [ ] P00-T04 Configure lint, type checks, unit tests, API integration tests, Firebase Emulator tests and browser E2E tests using the existing stack.
- [ ] P00-T05 Add CI stages and a small health endpoint. Errors/logs include request IDs without credentials, question bodies or keys.
- [ ] P00-T06 Create progress, decision and test-matrix documents. Inventory existing Firebase rules without deploying replacements.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P00-V01 | Clean install, application startup and production build | All succeed with documented versions; no unexplained warning affecting safety |
| P00-V02 | Run a unit fixture, an API fixture and a browser route smoke | Real runners execute; results saved with commands |
| P00-V03 | Start integration tests without emulator configuration | Fail closed; no production connection attempted |
| P00-V04 | Inspect client build and git changes for secret material | No service-account key, provider secret or admin credential |
| P00-V05 | CI executes an intentionally failing temporary fixture | CI fails; fixture then removed and suite passes |

**Deliver:** environment map, working scripts and phase report. **Exit gate:** tests can run locally/CI; production targets are isolated. **Next:** Phase 01.

## Phase 01 — Inspect the real dataset and define mapping

**Outcome:** an evidence-backed inventory and deterministic source-to-target contract.

### Tasks

- [ ] P01-T01 Inspect the named scraper/uploader and representative local JSON without running network scraping or uploads. Identify IDs, sanitization rules, overwrite behavior, uploader errors and authentication.
- [ ] P01-T02 Read authorized sample/export data from `gatematrix-40566` / `papers`. Record actual Firestore database ID rather than assuming `(default)`, source doc IDs, current rules and store location. If access is absent, continue with the supplied schema but mark real-data checks blocked.
- [ ] P01-T03 Scan all available metadata and question structure. Reconcile branch counts, paper totals, `total_questions`, array lengths and overall occurrence count. A mismatch is an audit result, not something to silently repair to 21,370.
- [ ] P01-T04 Select at least 3 representative papers per branch where available: full mock, subject test and topic/weekly quiz. Extend coverage for all question types, providers, math/image forms and source answer encodings. Record missing categories rather than fabricate samples.
- [ ] P01-T05 Enumerate actual values of `qtype`, raw tags, marks, answer strings, NAT ranges, option keys and numbering. Detect empty prompts, duplicated `qnum`, missing keys/solutions and suspiciously truncated records.
- [ ] P01-T06 Compare local files and cloud docs by stable source reference and content hash. List removed base64 values and unresolved HTML/image references. Do not assume uploader success means complete content.
- [ ] P01-T07 Add required metadata gaps: test kind, duration, sections, scoring profile, syllabus year, topic taxonomy, publication eligibility, review state and release configuration.
- [ ] P01-T08 Produce the mapping below as a versioned adapter specification. Preserve raw fields privately and map unknowns to an explicit review queue.

### Field mapping contract

| Source field | Normalized target/use | Important behavior |
| --- | --- | --- |
| `title` | `tests.title` and safe catalogue title | Preserve source value; sanitize display |
| `branch` | `branchCode`, `source.branchRaw` | Alias table maps spaced/underscored known labels; unknown labels quarantined |
| `provider` | `source.provider` | Provenance, not an admin/merchant role |
| `series` | `source.seriesLabel` | Curator separately assigns application series/product |
| `file_name` | Private source reference | Not a global ID; do not expose internal paths publicly |
| `total_questions` | `source.reportedCount` | Compare with actual array length; derive trusted published count |
| `questions[]` | Versioned questions plus ordered test items | Preserve occurrence order and every rejected occurrence in error report |
| `qnum` | `source.qnumRaw`, reviewed display number | Not the response document ID |
| `qtype` | `MCQ`, `MSQ`, `NAT` enum | Unknown values fail validation |
| `correct_answer` | Private key's stable option-ID set or exact NAT value | Parse using observed, explicit grammar |
| `nat_range` | Private accepted decimal intervals | Never expose before authorized review |
| `marks.positive/negative` | Raw decimal strings and reviewed rational scoring fields | Resolve profile conflicts before publication |
| `tags` | `rawTags`, reviewed primary subject/topic/difficulty | Missing difficulty stays unknown; do not invent |
| `question_text` | Search/accessibility fallback | Do not expose paid text in public catalogue/search |
| `question_html` | Sanitized semantic question body | Strip scripts and answer-revealing annotations |
| `question_images` | Private question asset IDs | Reconcile with HTML references, not only this array |
| `options` | Stable option IDs with sanitized text/HTML/assets | Strip correctness styles/attributes and preserve source-label mapping privately |
| `answer_text` | Private key summary | May reveal correctness even if `correct_answer` was removed |
| `solution_text/html/images` | Private solution body and private solution assets | Released only through authorized review API |

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P01-V01 | Sum source branch counts and compare local/cloud inventory | Exact report of observed totals and discrepancies; no fabricated reconciliation |
| P01-V02 | Paper claims 65 questions but contains 63 | Flag incomplete; block full-mock publication |
| P01-V03 | Same `qnum` in two papers or two section occurrences | Preserve distinct source occurrences; no overwrite |
| P01-V04 | Blank/unknown branch, missing options or malformed question | Row-level error with paper reference and array index |
| P01-V05 | Audit run before/after checksums | Source files/cloud documents unchanged |
| P01-V06 | Cloud image removed but local base64 exists | Recoverable asset recorded; not treated as text-only success |

**Deliver:** SOURCE-AUDIT, FIELD-MAPPING, representative fixture manifest and unresolved decisions. **Exit gate:** every launch candidate has a known source mapping; count and encoding anomalies are visible. **Next:** Phase 02.

## Phase 02 — Recover images and normalize HTML and math

**Outcome:** question and solution content renders correctly without leaking answers or executing scraped code.

### Tasks

- [ ] P02-T01 Parse HTML with a proper HTML parser. Extract assets from question/solution arrays, option HTML, `src`, `srcset` and any supported styles. Reject unsupported references with an explicit error; do not use regex alone as an HTML sanitizer.
- [ ] P02-T02 Recover base64 bytes from original JSON/HTML where available. Validate actual type, size and image decoding; hash/deduplicate bytes and upload only to private staging storage. Preserve an asset mapping manifest and source checksum.
- [ ] P02-T03 Resolve relative URLs against the recorded source origin or local asset directory. Do not guess missing origins or use an authenticated provider session to bypass access controls. Bound downloads, redirects, content length and timeouts; block private-network requests.
- [ ] P02-T04 Separate question/option asset references from solution references. Even deduplicated storage bytes require per-use authorization; knowing an asset ID must not expose unrelated solution diagrams.
- [ ] P02-T05 Implement allowlisted HTML/MathML/LaTeX rendering. If original LaTeX exists, render with controlled settings; otherwise sanitize retained semantic math carefully. Include required fonts/CSS. Preserve accessible labels, tables, subscripts and superscripts.
- [ ] P02-T06 Remove scripts, handlers, unsafe URLs, hidden solution containers, provider correctness classes, comments and `data-*` answer hints. Test custom provider markup; a generic XSS sanitizer alone does not remove all answer clues.
- [ ] P02-T07 Missing essential diagram, option formula or solution figure quarantines the affected publishable content. Add human review for contradictory text/HTML. Never replace a missing exam diagram with an invented AI image.
- [ ] P02-T08 Implement asset fetch authorization and short-lived delivery. Use no-store for protected responses and keep private assets out of service-worker offline caches.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P02-V01 | Base64 source image → stored private image → rendered diagram | Image content preserved; no dead placeholder |
| P02-V02 | Base64 was removed in cloud and original cannot be found | `MISSING_ASSET`; affected item blocked from publication |
| P02-V03 | Formula, matrix, fraction, circuit, long table and image-only option fixtures | Legible at desktop/mobile and zoom; no clipping/lost notation |
| P02-V04 | HTML with script, onerror, javascript URL or hostile SVG | Inert/rejected; no script execution or unwanted network request |
| P02-V05 | Option has `data-correct`, green correctness class, HTML comment or hidden solution | Learner-rendered DOM/payload contains no clue |
| P02-V06 | User requests solution image during active attempt or another user's asset | Denied before returning bytes or URL |
| P02-V07 | Relative path, traversal path, oversized file and private-IP redirect | Valid path resolved from evidence; malicious/unsupported paths rejected |
| P02-V08 | Same mathematical content appears in KaTeX HTML and hidden accessibility representation | No duplicate visible formula; screen-reader representation retained appropriately |

**Deliver:** ASSET-AUDIT, recovered-asset manifest, sanitizer/renderer tests and real browser screenshots. **Exit gate:** all essential assets for the selected launch subset resolve; the rendering review passes. Other broken items may remain quarantined. **Next:** Phase 03.

## Phase 03 — Normalize and migrate into staging

**Outcome:** a versioned, replayable serving model that preserves the original `papers` collection.

### Tasks

- [ ] P03-T01 Implement deterministic identities. Namespace a source paper by provider/source manifest and stable source path/doc ID; record collisions for review. Do not key solely on title or filename.
- [ ] P03-T02 Preserve each source occurrence with paper reference, array index and raw `qnum`. Assign canonical question/family IDs separately. Duplicate detection must not collapse distinct questions with similar text or different diagrams/keys.
- [ ] P03-T03 Split question presentation, private keys/solutions, test metadata and test-item order. Use the PRD collections: `questionVersions`, `answerKeys`, `testVersions/{id}/items/{itemId}`, `series`, `products` and `publicCatalog`. Keep `papers` as restricted source; do not rename/delete it.
- [ ] P03-T04 Use `itemId` as the attempt-response identity, with `questionVersionId` and ordinal as fields. This refines the earlier `responses/{qvid}` suggestion: repeated occurrences of the same question version must not overwrite each other. Scoring is per occurrence; fresh-performance analytics uses canonical family identity.
- [ ] P03-T05 Parse MCQ/MSQ answers into stable option IDs using the observed grammar. Accept documented delimiters only. Empty, unknown or conflicting answer text becomes a validation error. Never guess that an ambiguous string is an option sequence.
- [ ] P03-T06 Parse NAT range endpoints as finite decimal strings and require `low <= high`. An exact answer with no range becomes `[value, value]`. Conflicting exact/range fields require review; do not invent a tolerance.
- [ ] P03-T07 Preserve `sourceMarksRaw`. Store scoring as rational integer numerator/denominator with a `scoringProfileId`. An exact source penalty `0.66` is `66/100`; an approved standard exam penalty may be `2/3`. Reviewer chooses the profile and records any override; never silently substitute one for the other.
- [ ] P03-T08 Parse raw tags into reviewed subject/topic mappings. Add category, duration and section metadata through curation. “Advance Level” is a source label, not measured question difficulty. Do not assume every test is 180 minutes.
- [ ] P03-T09 Add schema validation, dry-run mode, checkpoints, content hashes, run IDs, bounded concurrency and per-item failures. Keep large HTML/asset bodies out of indexes and oversized documents out of writes. Firestore's document ceiling is 1 MiB [R2]; use conservative headroom plus real emulator/staging write tests.
- [ ] P03-T10 Import only into the explicitly selected emulator/staging target. Repeat unchanged input creates no duplicate versions; changed input creates a new draft version with a diff. Produce a rollback plan scoped to new migration records, not the source collection.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P03-V01 | Run same import twice | Same IDs/versions/counts; second run reports unchanged records |
| P03-V02 | Interrupt halfway and resume | No duplicate items and no partially published test |
| P03-V03 | Change source key or diagram | New draft version; prior published version preserved |
| P03-V04 | MSQ strings with observed separators, reordered options and invalid label | Valid forms map correctly; invalid/ambiguous forms quarantined |
| P03-V05 | NAT `0`, negative range, reversed bounds, NaN, comma ambiguity | Valid decimals preserved; bad cases rejected explicitly |
| P03-V06 | `negative="0.66"` under unresolved profile | No silent conversion to 2/3; publication blocked pending policy |
| P03-V07 | Repeat same qvid twice in one test | Distinct item IDs and response records retained |
| P03-V08 | Reconcile source occurrences to accepted plus quarantined counts | No unexplained loss; duplicate families tracked separately |
| P03-V09 | Oversized HTML/document or missing duration/section metadata | Actionable error; no silent truncation or assumed full mock |
| P03-V10 | Dry run against configured source | Zero writes; import attempts against production without release mode fail closed |

**Deliver:** normalized staging dataset, migration report, exact scoring profile decisions and validation fixtures. **Exit gate:** a reviewed beta subset is complete, deterministic and renderable; all other source records remain accounted for. **Next:** Phase 04.

## Phase 04 — Google authentication and protected APIs

**Outcome:** identity, ownership and access are enforced before any learner receives protected content.

### Tasks

- [ ] P04-T01 Implement Google sign-in, sign-out, return-to-route handling, onboarding and one server-controlled profile per Firebase UID.
- [ ] P04-T02 Verify tokens in protected APIs and derive UID from verified identity. Reject client-supplied role, paid status, score and entitlement fields. Check account suspension and current admin-role status server-side.
- [ ] P04-T03 Apply deny-by-default client access to private staging Firestore/Storage, including source `papers`. Do not expose an entire paper and merely remove answers in React. Firestore rules cannot selectively hide readable document fields [R1].
- [ ] P04-T04 Implement an access service for free tests, frozen bundle manifests, active scoped passes, expiry, withdrawal, suspension and active-attempt leases. Use seeded nonpaying/free/manual test grants until Phase 08 adds real fulfilment.
- [ ] P04-T05 Implement explicit learner DTOs. Exclude `correct_answer`, `nat_range`, `answer_text`, all solutions and hidden correctness markers. Mark all protected routes/SSR responses private and no-store.
- [ ] P04-T06 Integrate App Check with supported verification for the chosen backend. Use development mechanisms only locally; no production debug bypass. App Check does not replace UID/resource checks or entitlements.
- [ ] P04-T07 Build reusable role middleware for support, editor, reviewer, finance and owner; require current permissions for sensitive operations. Add bounded request validation, distributed rate-limit interfaces and audit events.
- [ ] P04-T08 Implement server-only secret handling, chosen session/CSRF strategy, security headers and strict permitted origins. Make webhook authentication a separate provider-signature path for Phase 08.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P04-V01 | First/repeat sign-in, popup cancellation and sign-out | One profile; clear recovery; protected session no longer usable as designed |
| P04-V02 | Anonymous or invalid/expired token requests protected route | 401; no private metadata/body |
| P04-V03 | Free user or CS-only user requests unrelated paid/EE content | Denied regardless of UI, URL changes or localStorage |
| P04-V04 | User requests another UID's order/attempt/profile | No cross-user disclosure |
| P04-V05 | Direct client SDK reads source `papers`, private keys or Storage objects | Denied for free and paid accounts |
| P04-V06 | Query all learner routes, page HTML, hydration data and errors | No answer keys, solutions, secrets or raw source documents |
| P04-V07 | Admin role revoked during session; spoof role in request | Sensitive API immediately denies based on current server state |
| P04-V08 | Emulator rules suite and API authorization suite | Both pass; rules tests alone are insufficient because privileged server access bypasses rules |

**Deliver:** working Google Auth, role/access service, emulator rule tests and endpoint authorization matrix. **Exit gate:** no unauthenticated, unpaid or cross-user protected-content path. **Next:** Phase 05.

## Phase 05 — Catalogue and learner interface

**Outcome:** a usable, responsive product shell built from normalized metadata.

### Tasks

- [ ] P05-T01 Implement design tokens, typography, navigation and accessible reusable components from the PRD. Use the HTML preview as a visual reference, not as production security code.
- [ ] P05-T02 Build landing, branch catalogue, test/series detail, login/onboarding, learner dashboard and purchases/account shells. Distinguish source inventory from published tests.
- [ ] P05-T03 Filter by branch, test category and ownership; paginate through safe metadata APIs. Show correct test type, question count, duration, scoring profile and reviewed syllabus year.
- [ ] P05-T04 Build locked/free/included/completed/expired/unavailable UI states from server decisions. Preserve chosen product/branch across login.
- [ ] P05-T05 Product details state fixed bundle scope versus pass scope, validity and review-after-expiry policy. No fake discounts, affiliate claims or unsupported published counts.
- [ ] P05-T06 Add keyboard navigation, loading/empty/error states, readable math containers, responsive tables and reduced-motion behavior.
- [ ] P05-T07 Connect navigation to implemented routes. Incomplete features must be visibly unavailable in staging, not fake successful flows or decorative buttons.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P05-V01 | Branch/type filter, pagination and empty results | Correct records, stable cursors and useful empty state |
| P05-V02 | Compare cards with normalized published records | Counts/labels/durations agree; draft and quarantined content hidden |
| P05-V03 | Inspect public search, SSR payload and page source | Metadata only; no paid prompts or keys |
| P05-V04 | View at 360px, 768px and 1440px; zoom to 200% | No lost actions or page overflow; deliberate table scrolling allowed |
| P05-V05 | Keyboard-only navigation and reduced-motion setting | Visible focus, proper labels, no required animation |
| P05-V06 | Free, active-pass, bundle-only and expired seeded accounts | Correct CTA and scope explanation for each |

**Deliver:** browser-reviewed learner shell with screenshots at the stated widths. **Exit gate:** catalogue truth and core navigation verified. **Next:** Phase 06.

## Phase 06 — Attempt engine, autosave and recovery

**Outcome:** a learner can take a test reliably under server-controlled timing.

### Tasks

- [ ] P06-T01 Build instructions with marking rules, duration, connectivity behavior and explicit start. Loading instructions must not consume an attempt.
- [ ] P06-T02 Start attempts transactionally: validate scope and availability, lock one active timed session, snapshot manifest/profile/versions and establish server timestamps/deadline.
- [ ] P06-T03 Implement MCQ radio, MSQ multi-select and NAT numeric input with stable option IDs. Do not shuffle official order by default. Preserve any practice shuffle mapping in the attempt.
- [ ] P06-T04 Implement section navigation, question palette, clear response, mark-for-review, save/next, calculator and final submission summary. Review flags never suppress an otherwise answered response.
- [ ] P06-T05 Save by immutable test `itemId` with revision, session epoch and idempotency event ID. Validate membership and type server-side. Debounce changes and flush on navigation/submit; do not write timer ticks.
- [ ] P06-T06 Implement server-derived countdown and timeout enforcement on every mutation. Background expiry jobs clean up abandoned attempts but are not the sole deadline check.
- [ ] P06-T07 Restore acknowledged answers on refresh; keep a bounded pending-response queue scoped by UID/attempt. Indicate unsaved changes offline. Reject late-arriving answers after deadline; do not trust browser timestamps.
- [ ] P06-T08 Add session takeover and stale-writer rejection. Clearing browser storage cannot reset the attempt limit/deadline.
- [ ] P06-T09 Implement practice pause/resume separately with server-tracked active time and a maximum completion window. This may follow the timed beta if explicitly marked deferred and not advertised as ready.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P06-V01 | Start twice concurrently with same retry key | One attempt/lease; no duplicated attempt consumption |
| P06-V02 | Change answers, clear, flag, navigate and refresh | Latest acknowledged answer/flag restored per item |
| P06-V03 | Older save arrives after newer revision | Newer answer remains; stale update rejected |
| P06-V04 | Manipulate local clock or close/reopen tab | Original server deadline still applies |
| P06-V05 | Lose connection, reconnect before deadline | Pending valid responses synchronize with visible acknowledgement |
| P06-V06 | Reconnect after deadline with unsaved responses | Late mutations rejected; only acknowledged state submitted |
| P06-V07 | Another device takes over and old device sends save | New epoch succeeds; old epoch rejected |
| P06-V08 | Manual submit races with scheduled expiry and duplicate submit | One terminal submission and idempotent scoring event |
| P06-V09 | Clear NAT response versus enter `0`; enter invalid decimal | Blank differs from zero; invalid value gets clear error |
| P06-V10 | Request item outside attempt or guess question/asset ID | No content disclosure or save permitted |

**Deliver:** tested timed engine, recovery flows and queued submission contract. **Exit gate:** no acknowledged-answer loss in tested scenarios; timing/session rules are server-enforced. **Next:** Phase 07.

## Phase 07 — Trusted scoring and solution review

**Outcome:** exact, reproducible scores and controlled access to correct answers.

### Tasks

- [ ] P07-T01 Implement a pure server scorer using snapshotted item/key/profile versions, exact decimal/rational arithmetic and presentation-only rounding.
- [ ] P07-T02 Score MCQ by one stable option ID; MSQ by exact set equality independent of order; NAT by reviewed inclusive ranges. Wrong/blank handling follows the chosen profile.
- [ ] P07-T03 Use a durable submission/outbox workflow and idempotent scoring worker. Store immutable result versions and allow retry after worker failure without reopening answers.
- [ ] P07-T04 Implement score summary, correct/wrong/skipped counts, attempted accuracy and penalty marks. Show negative scores honestly; never clamp the true result to zero.
- [ ] P07-T05 Implement paginated authorized review: original question/answer, key, explanation, assets, bookmark and issue-report references. Result summary ownership and solution-access entitlement checks are separate.
- [ ] P07-T06 Add versioned correction/regrade support. `award_all` versus `exclude` is a reviewed policy, not guessed by the worker. Preserve original result and correction reason.
- [ ] P07-T07 Add machine-readable golden scoring fixtures with independently hand-calculated expected results. Make exact source-profile and standard-profile behaviors explicit.

### Golden fixtures

| Case | Input | Expected result |
| --- | --- | --- |
| Standard MCQ correct | +2, selected correct option | +2 |
| Standard MCQ wrong | 1-mark item, wrong option | −1/3 internally |
| Standard MCQ wrong | 2-mark item, approved standard profile | −2/3 internally |
| Source decimal penalty | 2-mark item, explicit source profile with `0.66` penalty | −66/100, not −2/3 |
| MSQ exact match | Key A,C; response C,A | Full configured positive marks |
| MSQ partial or extra | Key A,C; response A or A,C,D | Zero under standard profile |
| NAT boundary | Range [2.49,2.51]; values 2.49 and 2.51 | Correct at both endpoints |
| NAT outside | Same range; value 2.5101 | Incorrect |
| NAT zero | Exact key 0; blank versus `0` | Blank skipped; zero correct |
| Marked answer | Correct answer and review flag set | Still correct |
| Mixed standard test | +2 correct, wrong 1-mark MCQ, wrong 2-mark MSQ, +2 NAT, blank 1-mark MCQ | 11/3 = 3.67 displayed out of 8; 4 attempted, 2 correct, 50% accuracy |

### Additional tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P07-V01 | Execute every golden fixture through pure scorer and persisted attempt | Exact stored results agree with independently calculated values |
| P07-V02 | Inspect active-attempt API versus post-submit review API | Keys absent before permitted review; present only when authorized |
| P07-V03 | Worker crashes before/after writing result and retries | One current result; no duplicate analytics event effects |
| P07-V04 | Client submits fake score or modified key/version | Ignored/rejected; server snapshot determines result |
| P07-V05 | Correct a key and regrade affected attempts | New result version, deterministic delta and visible correction history |
| P07-V06 | Expired user opens historical summary and paid solution | Summary available; solution locked except valid bounded review lease |

**Deliver:** verified scorer, result/review pages and correction pipeline. **Exit gate:** golden fixtures and key-leakage tests pass. **Next:** Phase 08.

## Phase 08 — Checkout, payments and entitlements

**Outcome:** purchases grant exactly the intended access once, including retries, expiry and refunds.

### Tasks

- [ ] P08-T01 Implement versioned bundles and prepaid branch passes. Snapshot bundle manifests, price, currency, validity and terms into each order. Changing profile branch must not change purchased scope.
- [ ] P08-T02 Compute checkout amount in paise server-side. Reject stale/unavailable offers and duplicate ownership where appropriate. Store local idempotency reference before external provider calls.
- [ ] P08-T03 Integrate the selected provider's sandbox checkout. Verify checkout signature and independently confirm matching order, amount, currency and captured payment status before fulfilment.
- [ ] P08-T04 Implement raw-body signed webhooks with durable receipt, event deduplication and out-of-order processing. Callback, webhook and reconciliation converge on one deterministic order-linked grant.
- [ ] P08-T05 Recover payment provider timeouts with unknown outcomes by reconciliation, not blind duplicate orders/charges. Display pending verification without asking users to pay again.
- [ ] P08-T06 Implement expiry, renewal, suspension and overlap resolution. Existing timed attempts may finish after natural expiry at their original deadline; only that attempt gets a bounded 24-hour review lease after submission. Refund/suspension invalidates its lease immediately. New starts still require valid scope.
- [ ] P08-T07 Implement finance-authorized refund requests and confirmed refund processing. Revoke only the affected grant; another valid grant can still authorize access. Partial refunds require an explicit recorded access decision.
- [ ] P08-T08 Add receipts/history and reconciliation queue. Keep captured gross, refunds, fees and settlements separate. Product terms and merchant/tax configuration must be supplied before live checkout.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P08-V01 | Successful sandbox capture | One order, one grant and correct expiry/scope |
| P08-V02 | Browser fakes success or alters price/order/currency/signature | No access granted |
| P08-V03 | Valid signature but payment is only authorized, not captured | No fulfilment until trusted capture |
| P08-V04 | Callback, webhook and reconciliation race; events duplicated/reordered | One grant; fulfilled state never regresses from a late failed event |
| P08-V05 | Browser closes during payment; webhook arrives later | Next login recovers access without a second purchase |
| P08-V06 | Capture recorded but fulfilment crashes | Retry creates missing grant once; operations queue clears |
| P08-V07 | Full refund confirmed with another matching pass active | Refunded grant revoked; other valid access remains |
| P08-V08 | Pass expires mid-attempt then learner starts another test | Existing bounded attempt continues; new start denied |
| P08-V09 | Refund/suspension during an attempt | Further protected reads/writes denied by policy |
| P08-V10 | Renew active versus expired pass | Extend current end versus start from verified capture as documented |
| P08-V11 | Pass user requests different branch; bundle buyer requests new series | Denied unless separate qualifying grant exists |

**Deliver:** sandbox-verified commerce, entitlement lifecycle and payment recovery report. **Exit gate:** no UI-only fulfilment, no double grant and all money/access invariants pass. **Next:** Phase 09.

## Phase 09 — Evidence-based analysis and practice recommendations

**Outcome:** useful topic feedback based on reviewed tags and real attempt evidence.

### Tasks

- [ ] P09-T01 Build subject/topic aggregates from eligible completed attempts; use one primary topic for additive totals. Separate test kind, timed/practice mode, allowances and scoring versions.
- [ ] P09-T02 Count fresh performance by canonical question family, not source occurrence. Do not treat repeated exposure across different providers as independent evidence when deduplicated.
- [ ] P09-T03 Implement the PRD evidence window: most recent 30 fresh scorable responses per topic within 60 days, from at least two completed tests. Below 10 fresh responses show Need more evidence. With sufficient evidence: <50% Needs work; 50–79% Building; ≥80% Strong in recent practice.
- [ ] P09-T04 Show accuracy numerator/denominator, sample window, coverage and approximate dwell time. Untagged questions remain visible as unclassified and do not generate guessed topic diagnoses. Exclude bonus/void questions from mastery evidence unless a reviewed policy explicitly says otherwise.
- [ ] P09-T05 Recommend up to three published, entitled practice actions. If fresh relevant questions are unavailable, offer labeled revision or say no suitable practice exists.
- [ ] P09-T06 Implement result/dashboard/progress views with text equivalents for charts, cold-start state and stale-evidence state. Do not show estimated AIR or an arbitrary AI readiness percentage.
- [ ] P09-T07 Implement cohort percentile only after at least 30 distinct eligible first attempts on the same immutable test/scoring version, timing mode and allowance. Hide below threshold; show cohort size and formula.
- [ ] P09-T08 Make aggregate jobs idempotent and support full rebuild after corrections. AI narrative generation is optional later and must not determine scores or invent reasons for mistakes.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P09-V01 | Four answers or ten answers from only one test | Need more evidence; no strong/weak claim |
| P09-V02 | 4/12, 8/12 and 15/18 fresh correct across qualifying tests | Needs work, Building and Strong recently respectively |
| P09-V03 | Same canonical question repeated across tests/providers | First eligible exposure only in fresh performance |
| P09-V04 | Missing tags or stale evidence | Explicit unclassified/stale state, no fabricated topic mapping |
| P09-V05 | Completed-event replay, regrade and aggregate rebuild | Same aggregates; no inflated counts |
| P09-V06 | Recommendation candidate is unowned, withdrawn or already repeated | Excluded or clearly labeled entitled revision |
| P09-V07 | Cohort size 29 then 30; include score ties | Hidden then correct disclosed percentile/rank calculation |
| P09-V08 | No attempted questions, negative score or zero denominator | No NaN/infinite percentages; accurate empty/negative states |

**Deliver:** reproducible topic analysis and recommendations with fixtures. **Exit gate:** every claim has valid evidence and every recommended action is accessible. **Next:** Phase 10.

## Phase 10 — Admin panel and new-series publishing

**Outcome:** administrators can manage users/payments and safely release new content without developer intervention.

### Tasks

- [ ] P10-T01 Implement role-specific admin navigation and APIs for user lookup, access history, attempts, payment status, refunds, reports and audit trail. Show only necessary PII for each role.
- [ ] P10-T02 Build admin import UI using the existing normalization/validation pipeline. Accept the owner's paper JSON schema; do not build a second inconsistent parser. Provide dry-run counts and row-level errors before staging import.
- [ ] P10-T03 Implement question editor with separate question/options, private key, solution, assets, classification and provenance tabs. Include question-only and post-submit review previews.
- [ ] P10-T04 Add draft → validation → review → approved → scheduled/published → withdrawn states. Prevent editor-only accounts from publishing or refunding. Owner overrides require recorded reasons.
- [ ] P10-T05 Build series composer for reviewed test versions, branch, test category and release order. Validate duration, marks, count, assets, taxonomy and publishing eligibility.
- [ ] P10-T06 Build the release-impact preview: eligible active matching passes gain included access; normal users see a priced bundle; old bundle purchasers keep frozen scope. Require an actual offer price/validity before paid release, not an automatically invented price.
- [ ] P10-T07 Confirm a preview hash/version during publish. Commit release/public catalogue metadata atomically where feasible or through a resumable staging state. No half-published bundle may become buyable.
- [ ] P10-T08 Add user support actions, finance reconciliation/refund interface, scoped exports and immutable audit events. Escape spreadsheet formula values in CSV exports. Manual grants require owner permission, scope, reason and expiry.
- [ ] P10-T09 Wire question reports to approved correction/regrade and withdraw content without deleting historical attempts. Preserve account/finance data needed for audit under the approved retention policy.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P10-V01 | Support/editor/reviewer/finance try each protected mutation | Only permitted role succeeds; denial is server-enforced |
| P10-V02 | Import same JSON through CLI and admin UI | Same validation, normalized IDs and error results |
| P10-V03 | Publish missing-key, missing-image, unresolved-profile or unreviewed test | Specific blocker; no public/paid listing |
| P10-V04 | Publish approved CS series with priced bundle | Active CS passes get Included; normal users can buy; old unrelated bundle owners do not gain access |
| P10-V05 | Same release checked by EE-pass user | No CS access unless independently entitled |
| P10-V06 | Change source version/offer between preview and confirm | Reject stale preview; require refreshed access-impact view |
| P10-V07 | Retry/interrupt release | One consistent published release or a recoverable unpublished state |
| P10-V08 | Withdraw series used in existing attempts | Enforce withdrawal policy and preserve history/audit; show clear unavailable state |
| P10-V09 | Export user-controlled string beginning `=`, `+`, `-` or `@` | Safe CSV output without formula execution; export actor/filters logged |
| P10-V10 | Reviewer corrects key, finance refunds order, owner grants access | Each action records version/source/reason and correct role |

**Deliver:** complete operational admin panel and demonstrated new-series access flow. **Exit gate:** new content can be safely added, reviewed, sold and included in matching passes through the admin UI. **Next:** Phase 11.

## Phase 11 — Integrated regression and release candidate

**Outcome:** one tested release candidate with evidence across content, learning, money and access.

### Tasks

- [ ] P11-T01 Run full vertical journeys in staging: free learner → diagnostic → result; bundle buyer → checkout → paid test → review; pass buyer → newly released series → included attempt.
- [ ] P11-T02 Run API/rules/asset authorization regression across anonymous, free, paid, expired, refunded, suspended and all admin roles. Inspect network payloads, browser storage and build outputs for secrets/keys.
- [ ] P11-T03 Exercise offline/refresh/takeover/deadline races, score correction, payment replays and rollback on the same build. Use provider sandbox for financial tests.
- [ ] P11-T04 Run actual browser/device checks: desktop Chrome/Firefox and representative mobile Chrome/Safari where available. Include Google popup/redirect behavior, equations, image zoom, calculator, NAT keyboard and keyboard-only completion.
- [ ] P11-T05 Load test the agreed starting workload: proposed 500 simultaneous attempts, roughly 33 save requests/second average with 3× bursts. Measure starts, saves, windows, submissions and queue delay separately. These are targets, not proven capacities.
- [ ] P11-T06 Measure proposed p95 warm question fetch ≤500ms, save acknowledgement ≤800ms and scoring completion ≤10s in the intended region with representative assets. Document cold starts, errors and cost; tune or revise launch limits explicitly if targets fail.
- [ ] P11-T07 Exercise backups/restore in an isolated target and re-run verified payment reconciliation. Document measured recovery against the agreed beta objective; do not restore over production to test recovery.
- [ ] P11-T08 Configure alert ownership for save failures, queue lag, captured-but-ungranted orders, asset failures, abuse signals and budget consumption. Alerts are not spending caps.
- [ ] P11-T09 Run a small reviewed beta and fix critical learner confusion. Confirm content eligibility, published policies, support contact and merchant settings. Unknown-content records can remain quarantined.
- [ ] P11-T10 Produce a release packet with commit, migration manifest, environment names, test results, screenshots, unresolved issues, rollback steps and exact proposed production actions.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P11-V01 | All three end-to-end journeys | Real records and correct access/results; no mocked success in release build |
| P11-V02 | Run full regression on release commit | Mandatory suites pass; skipped/unavailable checks visibly reported |
| P11-V03 | Browser network/HTML/storage/build inspection | No private source paper, pre-submit key, secret or cross-user cache response |
| P11-V04 | Load workload and burst scenarios | No acknowledged-answer loss/double submit; measured latency/error report |
| P11-V05 | Restore staging backup and reconcile ledger | Recovery evidence and correct grants; no duplicate charge/grant |
| P11-V06 | User deletion/sign-out/session revocation paths | Appropriate data/session handling; approved finance retention separated |
| P11-V07 | Keyboard, screen widths, zoom and reduced motion | Test flow remains usable; no hidden essential controls |
| P11-V08 | Alert drills and emergency feature switches | Owner receives test signal; new checkout/start switches work without unnecessary disruption of active tests |

**Deliver:** release candidate evidence packet. **Exit gate:** no unresolved critical/high defect in access, score correctness, data integrity or payment fulfilment; required real-data and browser checks complete. **Next:** Phase 12 only when production actions are authorized.

## Phase 12 — Controlled deployment and post-release smoke

**Outcome:** deploy the tested build and a reviewed content subset with an exercised recovery path.

### Tasks

- [ ] P12-T01 Verify the authorized production project/database/region, release commit, secrets, payment mode and migration manifest. Keep a current backup/export and source checksum before writes. Production `papers` remains preserved.
- [ ] P12-T02 Apply required indexes/rules/services and additive normalized migration in a documented sequence. Verify indexes/readiness before switching traffic. Do not destroy existing client access paths without checking whether a live app depends on them and arranging a concrete cutover.
- [ ] P12-T03 Deploy backend and frontend from the tested commit; canary a small reviewed catalogue. Check safe public metadata and private access first.
- [ ] P12-T04 Test live Google login and an authorized synthetic/free smoke attempt. For live payment verification, use only an explicitly authorized merchant test transaction; sandbox success is not proof of live configuration.
- [ ] P12-T05 Monitor error/save/payment metrics after canary, then expand approved content. Keep disputed, missing-asset or unreviewed papers unpublished.
- [ ] P12-T06 On a failure, disable new purchases/starts as appropriate, roll back code or published version pointers, preserve already acknowledged attempts/payment ledger and reconcile. Avoid dropping collections as a rollback shortcut.
- [ ] P12-T07 Record deployed version, observed checks, remaining limitations and support ownership. Define next-day reconciliation and first-week monitoring in the operating runbook, without claiming automated schedules exist unless implemented.

### Tests and expected results

| ID | Test | Expected result |
| --- | --- | --- |
| P12-V01 | Anonymous/free client accesses paid/source data after deploy | Denied in actual production rules/API configuration |
| P12-V02 | Google sign-in and free attempt save/submit/review | Correct real-environment identity, assets, timing and result |
| P12-V03 | Authorized live payment/capture/refund test where permitted | Live provider config and ledger reconcile; no unapproved charge |
| P12-V04 | Approved pass/new-series scenario | New eligible content included correctly; non-members see correct bundle |
| P12-V05 | Inspect critical metrics and queues after canary | No unexplained fulfilment delay, asset failure or acknowledged-answer loss |
| P12-V06 | Execute documented safe rollback in staging; verify production rollback readiness | Prior version recoverable without destroying orders/attempts |

**Deliver:** deployment report. **Exit gate:** deployment and required live smoke are verified; any missing live-payment authorization is disclosed as NOT VERIFIED rather than passed. **Next:** operate, review user feedback and plan a separately scoped release.

## 5 Test fixtures required across phases

Create fixtures when the relevant phase starts. A source example is not automatically a correctness oracle; expected answers/scores need independent review.

| Fixture group | Minimum cases |
| --- | --- |
| Source papers | Six branch mappings, three test categories where available, multiple providers, missing fields, count mismatch |
| Source identity | Same filename across providers/branches, repeated `qnum`, repeated question within a test, modified source version |
| Answer encodings | MCQ single key, every observed MSQ encoding, reordered set, duplicate option label, unknown option, ambiguous answer |
| NAT | Zero, negative, exact decimal, inclusive boundaries, null range, reversed/invalid range, conflicting fields |
| Marks | String `2.0`, `0.66`, `0.33`, zero penalty, invalid/negative amount, explicit source versus standard profile |
| Rendering | LaTeX, rendered KaTeX/MathML, diagram, image-only option, table, nested list, long formula and Unicode |
| Assets | Base64, relative path, absolute allowed URL, missing original, SVG, corrupt image, oversized payload |
| Injection/leakage | Script, event handler, unsafe protocol, source correctness classes/attributes/comments, hidden answer containers |
| Access accounts | Anonymous, free, bundle-only, active pass, expired, refunded, overlapping grants, suspended, each admin role |
| Attempt lifecycle | Refresh, offline, late save, stale revision, takeover, simultaneous start/submit/expiry, regrade |
| Payments | Pending, authorized, captured, invalid signature, duplicate/out-of-order event, unknown timeout, full/partial refund |
| Analytics | Empty, low evidence, repeat question family, missing topic, stale window, corrected result, small cohort, ties |

Seed fictitious identities and isolated emulator data. Do not use real customer emails or active payment credentials in fixtures.

## 6 Verification commands and implementation conventions

The commands below are **script contracts for the coding assistant to implement or map to the existing repository**. They are not commands that have already been run on this project. If the repository uses pnpm, yarn or another runner, retain it and record the equivalent commands. Commands must fail nonzero on required test failures; a zero-test run is not a pass.

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:rules
npm run test:e2e
npm run build
```

Required script behavior:

| Script | Contract |
| --- | --- |
| `test:unit` | Normalizers, decimals/scoring, access policy and analytics fixtures |
| `test:integration` | Own emulator lifecycle or require a verified running emulator; API, transaction and idempotency cases |
| `test:rules` | Firebase rules tests against emulators, including direct `papers`/Storage denial |
| `test:e2e` | Local/staging browser journeys with isolated accounts and artifacts on failure |
| `data:audit` | Read-only local/export inspection and reconciliation report |
| `data:normalize` | Deterministic normalized output and error manifest; no production mutation |
| `data:import:dry-run` | Validate target/schema/counts and show proposed staging writes; zero actual writes |
| `data:import:staging` | Explicit staging target, checkpoints and migration report |
| `test:load` | Documented workload on explicitly permitted nonproduction target |
| `test:recovery` | Backup/restore/reconciliation exercise on isolated target |

Do not provide a casual one-command production import alias. Production actions must be tied to the reviewed release manifest and environment guard. For Python import utilities, record exact test commands in the phase report, reuse the project's virtual environment and use an explicit write/dry-run mode.

### Completion report template

Save one report per phase. The coding assistant should not claim completion merely because code compiles.

```markdown
# Phase XX completion report
Status: PASSED | FAILED | BLOCKED
Commit or change reference:
Environment and target project:
Source fixture or snapshot version:

## Implemented tasks
- PXX-T01: implementation and changed files

## Tests actually executed
| Test ID | Command or manual procedure | Expected | Actual | Evidence |
| --- | --- | --- | --- | --- |
| PXX-V01 | Exact command | Expected behavior | PASS/FAIL/BLOCKED | Log/screenshot/report path |

## Data and security checks
- Source data preserved:
- Authorized target confirmed:
- Keys/secrets excluded from learner payload:
- New/changed record counts:

## Unresolved issues
- Severity, impact and next action; write None only if true.

## Gate decision
- Evidence that the phase exit gate is met, or exact blocker.
- Next eligible phase:
```

### Initial progress table

Copy into `docs/implementation/PROGRESS.md` and update as work proceeds.

| Phase | Status | Evidence | Next action |
| --- | --- | --- | --- |
| 00 | NOT_STARTED | — | Inspect repository and test setup |
| 01 | NOT_STARTED | — | Audit actual JSON/scripts/Firestore export |
| 02 | NOT_STARTED | — | Recover assets and validate safe rendering |
| 03 | NOT_STARTED | — | Normalize and migrate staging subset |
| 04 | NOT_STARTED | — | Implement identity and access boundary |
| 05 | NOT_STARTED | — | Build catalogue and learner UI |
| 06 | NOT_STARTED | — | Implement test engine and recovery |
| 07 | NOT_STARTED | — | Verify scoring and protected review |
| 08 | NOT_STARTED | — | Verify sandbox commerce and grants |
| 09 | NOT_STARTED | — | Implement evidence-based topic analysis |
| 10 | NOT_STARTED | — | Complete admin and publication workflow |
| 11 | NOT_STARTED | — | Run integrated release-candidate QA |
| 12 | NOT_STARTED | — | Execute authorized deployment and smoke |

## 7 Prompt to give your AI coding assistant

Copy the following with this Markdown file and the original PRD package into your coding assistant's project context:

```text
Implement my GATE preparation platform using the supplied PRD and
GATE-AI-Coding-Phasewise-Plan.md.

My existing dataset is described as Cloud Firestore project gatematrix-40566,
collection papers, with local JSON under scraped_dataset/. Inspect the real
repository and sample data before assuming field formats or file locations.
The source papers include questions, answers and solutions in the same document.
Never expose those raw documents or private answer fields to the learner client.

Start with the earliest incomplete phase. Implement its tasks, run the specified
relevant tests, fix failures, and save a phase completion report with actual evidence.
Proceed to the next dependent phase when the gate passes. Do not ask me to approve
every routine phase. If required data, credentials or an external action is missing,
report the exact blocker and continue independent safe work with labeled fixtures.

Preserve my existing source data. Use emulators/staging for development. Do not
run the scraper, uploader, production migration or live payment without the
relevant authorization in this implementation session. Do not expose secrets.

Handle missing images, KaTeX/HTML, source-specific MCQ/MSQ/NAT encodings,
0.66-versus-2/3 scoring differences, repeated question occurrences and raw tags
as specified. Never guess missing keys, duration, diagrams or taxonomy.

Use server-controlled entitlements, timer, autosave validation and scoring.
Active branch-pass users receive newly published eligible same-branch series
while valid. Bundle buyers retain their purchased manifest scope.

Create docs/implementation/PROGRESS.md, DECISIONS.md and TEST-MATRIX.md.
At each phase report changed files, tests actually run, results, blockers and
next phase. A missing browser/emulator test is BLOCKED, never PASSED.
The static UI preview is only a design reference, not a production implementation.
```

## 8 Launch acceptance checklist

- [ ] Launch papers have verified keys, essential assets, solutions, taxonomy, durations and approved scoring profiles.
- [ ] Every source occurrence is accounted for as imported, unchanged or quarantined; source `papers` remains preserved.
- [ ] Direct client reads of source papers/private keys are denied; protected API DTOs leak no key before permitted review.
- [ ] Google login, UID ownership, roles, grants, expiry and active-attempt lease rules work in the intended environment.
- [ ] Correct MCQ/MSQ/NAT scoring is proven by independent golden fixtures including raw `0.66` handling.
- [ ] Refresh, offline, concurrent save, takeover, submit and timeout scenarios preserve acknowledged answers.
- [ ] Captures, callbacks, webhooks and refunds converge on consistent orders and grants.
- [ ] New series publication includes active matching passes and creates the correct ordinary-user bundle offer.
- [ ] Analytics displays sample size and avoids unsupported conclusions from repeated or insufficient evidence.
- [ ] Real browser rendering and responsive/keyboard flows have been reviewed; placeholders are not counted as working features.
- [ ] Backup, reconciliation, monitoring and rollback evidence exists.
- [ ] Live deployment/payment checks are separately reported from sandbox checks; no unapproved live transaction occurs.

## 9 References and scope of verification

[R1] [Firebase documentation on field access](https://firebase.google.com/docs/firestore/security/rules-fields), checked 4 October 2026. Firestore security rules authorize document reads, not secret-field filtering inside a readable document. This supports isolating source papers and serving explicit authorized projections. The same documentation notes the server-library/IAM boundary.

[R2] [Firestore limits](https://firebase.google.com/docs/firestore/quotas), checked 4 October 2026. The documented per-document limit is 1 MiB (1,048,576 bytes). Moving assets out of documents must preserve their content; stripping image bytes without replacement references is not a complete content migration.

Other detailed product, design, exam and commerce references are in the original `08-decisions-and-sources.md`. The phase/test thresholds here are proposed implementation requirements, not claims that this system has achieved them. Official documentation for actual library/provider versions should be rechecked at implementation time.

This Markdown was prepared from your supplied dataset description and the current PRD files. No actual source paper, Firebase permissions, parser script, uploader script or production application was tested as part of creating it.
