GATE Matrix — Repair Phases and Coding Assistant Brief
Basis: AUDIT-REPORT.md, 5 October 2026.
Goal: A trustworthy paid GATE platform using the existing visual system and Firebase, with verified scoring, durable attempts, real commerce and operational admin tools.
Current release state: NO-GO for paid launch.
The uploaded phase reports are not evidence of completion. Reopen the relevant phases and attach actual execution artifacts. Work in an isolated development/staging environment; no production mutation, payment or content migration is authorized by this audit document.
Operating rules for the coding assistant
1. Read the audit, original phase plan and current source before changing code. Preserve the original ZIP/data. Record the branch/commit and environment for each test run.
2. Fix application authorization before introducing privileged Admin SDK reads/writes. Never relax Firestore rules to make broken code work.
3. Create a server-owned identity, role, access, price, timer and scoring boundary. Treat client UID/amount/score/status as untrusted input.
4. Keep original papers private and immutable. Normalize into new staging collections with versioned references; do not overwrite the raw dataset during repair.
5. Fail closed: missing question data, images, payment verification, credentials or entitlement must not become demo content, a successful order or guessed marks.
6. Do not fabricate records, mastery, subscribers, payment status or test results. Clearly label any intentional demo and isolate it from saleable products.
7. Tests must use fixture users and emulator/staging resources. A missing emulator/allowed staging target must fail before network writes. Never copy a production token into a test fixture.
8. A passing compile or unit helper does not prove a user journey. Every phase requires behavior tests, failure-path tests and evidence.
9. Preserve the source test assertions; repair behavior or document an approved requirement change. Do not weaken checks just to make CI green.
10. Complete one phase's exit gates before declaring it done. Mark blocked tests honestly and state the missing dependency.
Phase R0 — Contain unsafe paths and establish truthful gates
Issues: GM-01–05, GM-15, GM-20. Owner: backend/security + project owner.
- [ ] Remove production role-switch control and public role/grant writes.
- [ ] Disable simulated checkout/order-grant functionality until real integration is ready.
- [ ] Temporarily deny all unsupported write handlers; retain only explicitly safe public metadata endpoints.
- [ ] Remove or label hardcoded admin financial/user figures and unsupported “Official/Verified/Score recorded” claims.
- [ ] Configure separate development/emulator/staging targets with explicit allowed-project guard. Refuse mutation tests if configuration is missing or points to production.
- [ ] Configure ESLint noninteractively; add clean install, typecheck, lint, tests and build to CI.
- [ ] Copy audit-tests/ into the local project and run its dedicated config. Preserve the initial failing baseline.
- [ ] Add release revision/environment metadata and a phase evidence template.
Test after phase: Anonymous/cross-user requests cannot reach write models. Learner cannot set role or grants. Checkout cannot show a paid-success state from fabricated browser data. Test commands never target production and missing isolation configuration fails. Build and lint run without prompts.
Exit gate: Unsafe capabilities closed and baseline recorded. Do not declare payment or admin implemented merely because their buttons were disabled.
Phase R1 — Correct identity, storage and access boundaries
Issues: GM-01,02,04,06,20. Owner: backend/security.
- [ ] Choose verified bearer-token or server-session architecture; implement reusable server verification, UID derivation and role/ownership checks. If cookie sessions are used, include CSRF/origin protection for state changes.
- [ ] Replace source-map authority and fire-and-forget REST with awaited authenticated durable operations.
- [ ] Implement profile field allowlists; server-only role/grant assignment with audit logs.
- [ ] Write Firestore/Storage rules for intended direct-client access; deny private raw documents, keys, scores and financial writes.
- [ ] Define canonical User, Product, TestVersion, QuestionVersion, AnswerKey, Attempt, Response, Order, Grant and AuditEvent schemas. Use uid/userId consistently.
- [ ] Implement server access evaluation for public free samples, scoped passes, frozen bundle membership, validity, suspension, revocation and active-attempt leases.
- [ ] Validate IDs, pagination bounds and fields; use correct patch semantics and transactions; remove arbitrary-paper fallback.
- [ ] Add private/no-store headers for sensitive responses, bounded item delivery, rate limits and abuse telemetry. App Check is an additional signal, not user authorization.
Test after phase: Emulator rule matrix for anonymous/free/paid/other-user/editor/admin. Attempts to change owner/role/score fail. Missing or expired token denied. Storage failure returns honest failure and never a success record. Cold restart yields same state. Status updates preserve other fields. Unknown IDs return 404. Grants reject invalid/future/expired ranges and wrong branch/bundle. Sensitive DTOs have no answers or solution hints.
Exit gate: All identity/access invariants pass both API and SDK paths; A01–A08, A14–A15, A21–A22 pass. Successful owner/admin paths must pass too.
Phase R2 — Validate content and rebuild the catalogue contract
Issues: GM-05,07,08,09,14. Owner: data/content + backend + frontend.
- [ ] Obtain original representative source JSON and images for all six branches and MCQ/MSQ/NAT, including zero-question and malformed examples.
- [ ] Produce an actual inventory: source count, duplicate/empty/unparseable count, image completeness, answer/marks completeness and distribution permission status.
- [ ] Implement parser-based HTML sanitization and controlled asset URLs. Recover images before removing inline base64; maintain an asset manifest and hashes.
- [ ] Build one validated adapter for qtype/qnum/marks/options/NAT ranges/branch aliases. Preserve exact scoring metadata; quarantine ambiguous inputs.
- [ ] Generate immutable content/test versions and item occurrence IDs. Keep keys separate; support correction without rewriting historical attempt meaning.
- [ ] Repair uploader credential propagation, basename-only IDs, empty/stale skip logic and document-size validation. Reject zero-card scrape output or quarantine it explicitly.
- [ ] Replace count-only dry run with real transform/validate/diff reporting. Migrate an reviewed beta subset to staging idempotently.
- [ ] Store duration, total marks, type, branch, publication state and validated item count on test metadata.
- [ ] Use exact branch queries/cursor pagination; disable sales for unpublished/empty/broken content. Keep catalogue metadata lean.
- [ ] Remove demo fallback from selected test routes and add explicit unavailable/error/retry screens.
Test after phase: All branch aliases normalize correctly. NAT/MSQ remain their type. Options preserve IDs and text/HTML fallback. Decimal/rational penalties round-trip. XSS/answer-hint corpus stripped with real DOM validation. Essential images and equations render in real browser. Same 65-item manifest produces 65 items at catalogue/start/review. All branch filters/pagination work, no duplicate/missing pages. Failed load never substitutes a different paper.
Exit gate: A09–A13 and A19 pass; approved beta subset fully renderable; source→normalized→quarantined→published counts reconcile. Full inventory completion must not be claimed from a small beta subset.
Phase R3 — Build durable exams and trusted results
Issues: GM-10,11,17,18. Owner: backend + frontend + QA.
- [ ] Server start endpoint creates attempt with verified access, immutable manifest, deadline, lease and scoring-version reference.
- [ ] Response endpoint validates answer shape/option IDs/NAT grammar; uses revisions/idempotency to handle retries and out-of-order saves.
- [ ] Browser autosave displays Saving/Saved/Offline/Failed states; recover only acknowledged or explicitly queued responses with conflict handling.
- [ ] Server enforces deadline/finalization; browser timer renders server deadline. Define timeout, grace and reconnect behavior explicitly.
- [ ] Implement idempotent submit transaction and server scoring from private keys, never browser totals.
- [ ] Implement exact arithmetic, strict MCQ cardinality, MSQ set validation and finite NAT range checks without mutating inputs.
- [ ] Build actual result summary, question review and authorized solutions; remove false completion/score-recorded messages.
- [ ] Fix first-question navigation; add submit summary/restart/exit confirmation and all palette states, including answered+reviewed.
- [ ] Associate NAT labels, group radios, provide accessible math/option names and status announcements.
Test after phase: Correct/incorrect/skipped/reviewed MCQ/MSQ/NAT and mixed penalties; invalid numeric tokens; duplicate/unknown options; no score tampering. Reload/close/reopen, offline/reconnect, two tabs, clock changes and server expiry. Duplicate submit yields one immutable result. Score and explanations persist across login/session reload; unauthorized review denied. Keyboard input and navigation work.
Exit gate: A16,A17,A20 pass; all golden scoring fixtures and attempt recovery tests pass against real emulator/staging storage; complete start→answer→submit→result→review browser journey succeeds on validated data.
Phase R4 — Implement real payments and access lifecycle
Issues: GM-03,04,06,21. Owner: commerce/backend + QA.
- [ ] Define branch-pass versus frozen-bundle products, included test versions, validity/start policy, price in paise and receipt/refund fields.
- [ ] Require authenticated identity; create server-priced provider order; bind product/order/customer/currency/amount.
- [ ] Integrate actual Razorpay test checkout; verify signature, server-held order identity and captured payment status.
- [ ] Implement raw-body webhook verification, event deduplication, transactionally idempotent order/grant updates and retry/reconciliation jobs.
- [ ] Show pending/failed/cancelled/paid states from server facts. Handle browser close and delayed capture.
- [ ] Implement refund/revocation policy, audit trail, receipt/order history and support route.
- [ ] Validate all displayed taxes/fees/validity text against actual product/business configuration.
Test after phase: Successful capture, authorization-only, failure/cancel, delayed webhook, duplicate/reordered events, wrong signature, wrong owner/product/currency/amount, callback replay, connection loss after capture and partial/full refund policy. No test consumes real money. Verify access after payment and denial after relevant refund/expiry; no double grants.
Exit gate: Provider sandbox traces correlate order→captured payment→exactly one grant→access. No hardcoded payment IDs, shared anonymous UID, client price authority or UI-only success.
Phase R5 — Deliver real analytics and operational admin
Issues: GM-12,13,15. Owner: analytics + admin/backend.
- [ ] Build attempt history, topic aggregates, time/accuracy trends and recommendations from scored events.
- [ ] Apply ≥10 fresh items, ≥2 distinct tests, defined recent window and repeat-item deduplication; expose evidence counts and uncertainty.
- [ ] Build real paginated users/orders/grants tables and verified revenue definitions; distinguish captured/refunded/net/settled amounts.
- [ ] Implement admin import preview, validation report, draft/review/publish, version/withdrawal and audit log.
- [ ] Publish new series transactionally: active matching scoped passes receive eligible access; nonowners see a new purchasable bundle; existing frozen bundles remain unchanged.
- [ ] Implement least-privilege editor/reviewer/support/admin permissions and sensitive action confirmation/audit.
Test after phase: Analytics reconcile scored fixtures; one-test/too-small/stale/repeat evidence cannot produce strong claims. New series persists on reload; pass/free/bundle/expired users see correct behavior. Unauthorized roles cannot publish/grant/refund. Pagination/filter/search preserve ownership and totals. Failed import produces actionable errors with no partial publication.
Exit gate: A18 passes; actual data drives all dashboard/admin metrics; two fully demonstrated journeys: weak-topic recommendation→accessible practice, and admin publish→matching pass access/new bundle saleability.
Phase R6 — Mobile/accessibility, regression and launch readiness
Issues: GM-16–21 plus all prior findings. Owner: frontend/QA/operations + product owner.
- [ ] Add mobile navigation and compact exam controls; validate long math/tables/images.
- [ ] Implement accessible dialog/focus/Escape behavior and screen-reader statuses; test reduced motion and 200% zoom.
- [ ] Review all claims, brand, season metadata, product description, privacy/terms/refund/support/account controls and rights status.
- [ ] Triage dependencies and upgrade tested compatible versions; separate dev/prod advisory reachability.
- [ ] Add dependency/secret/security checks, readiness probes, redacted structured logs, error/payment alerts, release revision and documented rollback.
- [ ] Run full original + audit + emulator + provider-sandbox + browser regression suite from clean checkout.
- [ ] Rehearse backup restore and migration rollback in staging; document verified environment/rules/IAM settings.
Test after phase: Browser matrix at 360/390/768/1440 px, Chrome/Firefox/Safari or documented supported equivalents; keyboard/screen reader/zoom; slow network/offline/reconnect; concurrent submission/payment retry; representative real data from all supported branches. Measure performance with a documented device/network profile, not one audit request.
Exit gate: No unresolved P0 or core P1. All required test evidence reviewed; no critical/high reachable production dependency issue unresolved; content/commerce policies match behavior. Production release requires a concrete reviewed deployment and normal project authorization; this plan does not itself authorize production writes.
Required phase completion record
Phase / commit / deployment revision:
Environment and allowed project IDs:
Tasks completed:
Requirement IDs addressed:
Commands and exit codes:
Fixture IDs and expected vs actual results:
Browser/device sizes and journeys exercised:
Screenshots / logs / provider event references:
Negative-path tests:
Remaining risks / blocked tests / owner:
Rollback or recovery checked:
Exit gate: PASS / FAIL / BLOCKED
Next phase permitted: YES / NO
Release acceptance checklist
- [ ] Identity and roles are verified at every protected server boundary.
- [ ] Unpaid/other-user/wrong-branch/expired/refunded/suspended access is denied as specified.
- [ ] No private keys, correctness hints or premature solutions in learner payloads/assets.
- [ ] Every saleable test has a reviewed complete manifest, essential assets and clear provenance status.
- [ ] Selected test never turns into a sample/fallback paper.
- [ ] Acknowledged answers survive recovery and a server deadline governs completion.
- [ ] Server scores reproduce approved fixtures exactly and persist once.
- [ ] Captured provider payment fulfils once; fake/replayed/underpaid events do not fulfil.
- [ ] Branch passes and frozen bundles behave correctly when new series publish.
- [ ] Dashboard and admin show real, reconcilable data.
- [ ] Mobile, accessibility, error and support paths are verified.
- [ ] CI gates and dependency/environment checks run noninteractively.
- [ ] Required staging tests pass; production smoke is a separate recorded step.
Prompt to give your coding assistant
Read AUDIT-REPORT.md, REMEDIATION-PLAN.md and the original GATE-AI-Coding-Phasewise-Plan.md. Start with R0 and R1. Preserve source data and work only in isolated local/emulator/staging environments. Do not change production or introduce privileged database operations until route authorization is tested. Run the provided failing audit fixtures, fix their underlying causes, and add successful-path, emulator and browser tests. Complete each phase's exit gates with actual logs and screenshots. Never mark a phase passed from typecheck alone, fabricate payment/score data, or silently substitute demo questions. Report each completed phase using the required evidence template, including failures and blockers.