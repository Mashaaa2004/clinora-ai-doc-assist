# Architecture rules
- Scope homepage theme tokens and scrolling styles to the homepage; this preserves clinical-screen appearance and behavior.
- Preserve the existing voice-to-analysis-to-review-to-PDF workflow and AI provider when adding clinical grounding; this avoids unrelated MVP regressions.
- Store protocols and page-aware excerpts separately with authenticated reads and admin-only writes; retrieval must select verified, current clinical documents only.
- Keep retrieval, citation validation, identity minimization and clinical safety instructions in a server-only shared module used by both document endpoints; this keeps the grounding boundary consistent.
- Persist original AI drafts separately from clinician-approved final documents and audit approvals through authenticated database functions; client state must not grant approval.
- Extract PDF text locally with PDF.js and store original documents privately; unsupported scanned documents require manually reviewed text rather than fabricated OCR.
- Normalize device-rate microphone samples to 16 kHz PCM in the shared audio helper and resume Web Audio from the user gesture; browser hardware rates differ.
- Reserve the clinical PDF window before asynchronous approval checks and retain manual printing; Safari blocks late popups and automated print sheets.