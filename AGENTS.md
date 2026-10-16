# Architecture rules
- Preserve the existing voice-to-analysis-to-review-to-PDF workflow and AI provider when adding clinical grounding; this avoids unrelated MVP regressions.
- Store protocols and page-aware excerpts separately with authenticated reads and admin-only writes; retrieval must select verified, current clinical documents only.
- Keep retrieval, citation validation, identity minimization and clinical safety instructions in a server-only shared module used by both document endpoints; this keeps the grounding boundary consistent.
- Persist original AI drafts separately from clinician-approved final documents and audit approvals through authenticated database functions; client state must not grant approval.
- Extract PDF text locally with PDF.js and store original documents privately; unsupported scanned documents require manually reviewed text rather than fabricated OCR.