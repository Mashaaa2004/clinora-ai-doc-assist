# Protocol-grounded documentation implementation

## Delivered
- Existing `openai/gpt-5.6-sol` provider and call surface preserved in analysis and CRM drafting. No training or fine-tuning claim.
- Admin protocol metadata, private original file storage, PDF.js text extraction with page-aware passages, manual verification/currentness and keyword search.
- Real Postgres full-text retrieval from uploaded verified clinical documents. Pending, outdated and methodology documents are excluded from clinical retrieval.
- SOAP draft, missing/conflicting input and urgency flags, exact passage-ID citation validation, separate source excerpts and no-source message.
- Durable original AI draft and edited final record, rejection, explicit clinician approval, server audit and approval timestamp. Forged client approval and direct approved inserts without an audit are rejected.
- Patient-name/contact minimization; explicit per-request processing consent checked by both endpoints. Owners retain isolated clinical access.
- SOAP/provenance in one-page PDF and stored history.

## Observed tests (synthetic data, 2026-10-16)
- Vitest grounding/consent tests passed.
- Signed-in analysis returned HTTP 200, SOAP, missing/contradictory input warnings, no invented examination results and no drug prescriptions for input without medications.
- Missing final approval rejected; rejection accepted. Forged direct approved insert rejected.
- Authenticated UI: TXT upload, pending exclusion, verified passage search, editing, checkbox-gated approval, approved record readback and PDF opening all exercised.
- Real official methodology PDF extracted into 39 passages; it was marked methodology, not used as disease treatment guidance. Temporary test imports removed.
- Admin page checked at 1280px and 390px; no mobile horizontal overflow. No browser page errors in the consultation test.
- CRM drafting returned HTTP 200 with draft status, SOAP and `requires_clinician_approval`; missing consent returned HTTP 400.

## Boundaries and incomplete items
- No real disease-treatment protocols are preverified or seeded. An authorized admin must import and verify genuine current protocols. Keyword retrieval is real, not a simulated RAG response, but does not provide cross-language semantic search or OCR for scanned PDFs.
- Official national index could not be enumerated safely; the methodology page exposes accessible text-based PDFs. Automatic national-corpus import is not implemented.
- Citation validation ensures references are supplied excerpts; it does not mathematically prove all model statements are entailed. Medical review remains mandatory. Synthetic test documents were intentionally refused by AI as clinical guidance even though retrieval found them.
- Identifier minimization is defense-in-depth, not a complete free-text de-identification guarantee. Clinicians must remove identifiers and obtain appropriate consent before transmission. Voice/STT integration was preserved, not retested with live microphone hardware.
- CRM endpoint returns drafts but does not control approval inside the external Base44 platform. Base44 must send `consentConfirmed: true` and enforce its own clinician approval flow.
- Base44 row response display/failure notifications require its receiver/API contract and access to that application; no completed Base44 push integration is claimed.