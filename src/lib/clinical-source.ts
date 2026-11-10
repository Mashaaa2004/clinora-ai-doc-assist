export const MAX_CLINICAL_SOURCE_LENGTH = 15_000;

export function combineClinicalSource(transcript: string, extraDocument: string) {
  return [
    transcript.trim(),
    extraDocument.trim() ? `Qo‘shimcha hujjat:\n${extraDocument.trim()}` : "",
  ].filter(Boolean).join("\n\n");
}

export type ClinicalApprovalSnapshot = {
  result: unknown;
  patientName: string;
  patientReference: string;
  transcript: string;
  extraDoc: string;
  chosenIdx: number;
  selectedComorb: number[];
};

/** Detects ordinary local edits before restoring approval; the server remains authoritative for export. */
export function approvalFingerprint(snapshot: ClinicalApprovalSnapshot) {
  return JSON.stringify({
    result: snapshot.result,
    patientName: snapshot.patientName,
    patientReference: snapshot.patientReference,
    transcript: snapshot.transcript,
    extraDoc: snapshot.extraDoc,
    chosenIdx: snapshot.chosenIdx,
    selectedComorb: [...snapshot.selectedComorb].sort((a, b) => a - b),
  });
}
