import { describe, expect, it } from "vitest";
import { approvalFingerprint, combineClinicalSource, MAX_CLINICAL_SOURCE_LENGTH } from "../lib/clinical-source";

const snapshot = {
  result: { recommendation: "Kuzatuv", differentials: [{ name: "Taxminiy tashxis" }] },
  patientName: "Sinov Bemor",
  patientReference: "MRN-001",
  transcript: "Suhbat matni",
  extraDoc: "Epikriz matni",
  chosenIdx: 0,
  selectedComorb: [0],
};

describe("clinical source and approval revision", () => {
  it("includes the extra document in the analysis and final source", () => {
    expect(combineClinicalSource("Suhbat", "Epikriz")).toBe("Suhbat\n\nQo‘shimcha hujjat:\nEpikriz");
  });

  it("uses the server-compatible 15000 character source limit", () => {
    expect(MAX_CLINICAL_SOURCE_LENGTH).toBe(15000);
    expect(combineClinicalSource("a".repeat(8000), "b".repeat(8000)).length).toBeGreaterThan(MAX_CLINICAL_SOURCE_LENGTH);
  });

  it("changes the approval fingerprint when clinical content changes", () => {
    const original = approvalFingerprint(snapshot);
    expect(approvalFingerprint({ ...snapshot, result: { ...snapshot.result, recommendation: "Yangi reja" } })).not.toBe(original);
  });

  it("changes the approval fingerprint when patient or diagnosis selection changes", () => {
    const original = approvalFingerprint(snapshot);
    expect(approvalFingerprint({ ...snapshot, patientName: "Boshqa Bemor" })).not.toBe(original);
    expect(approvalFingerprint({ ...snapshot, chosenIdx: 1 })).not.toBe(original);
  });
});
