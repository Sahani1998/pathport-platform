import {
  resolveStage,
  isInternshipRelevant,
  isStudentInternshipEligible,
  INTERNSHIP_GATE_STAGE,
  STUDENT_HUB_GATE_STAGE,
} from "@/lib/application-stage-mapping";

// These helpers are the SINGLE SOURCE OF TRUTH for internship lifecycle gates.
// Every module (institution Internship Access, student hub, employer checks,
// analytics) must agree, so lock the behaviour down here.

describe("resolveStage", () => {
  it("prefers current_stage when present", () => {
    expect(resolveStage("enrolled", "approved")).toBe("enrolled");
  });
  it("falls back to status mapping when current_stage is null", () => {
    expect(resolveStage(null, "approved")).toBe("approved");
  });
  it("defaults to application_submitted when both are empty", () => {
    expect(resolveStage(null, null)).toBe("application_submitted");
  });
});

describe("isInternshipRelevant (institution management gate = enrolled)", () => {
  it("includes enrolled and every later stage", () => {
    expect(isInternshipRelevant("enrolled", "approved")).toBe(true);
    expect(isInternshipRelevant("internship_eligible", "approved")).toBe(true);
    expect(isInternshipRelevant("completed", "approved")).toBe(true);
  });
  it("excludes stages before enrolled — the bug this sprint fixed", () => {
    expect(isInternshipRelevant("approved", "approved")).toBe(false);
    expect(isInternshipRelevant("arrived_singapore", "approved")).toBe(false);
    expect(isInternshipRelevant("application_submitted", "submitted")).toBe(false);
  });
  it("excludes off-path (rejected / withdrawn) stages", () => {
    expect(isInternshipRelevant("rejected", "rejected")).toBe(false);
    expect(isInternshipRelevant("withdrawn", "rejected")).toBe(false);
  });
  it("gate stage is enrolled", () => {
    expect(INTERNSHIP_GATE_STAGE).toBe("enrolled");
  });
});

describe("isStudentInternshipEligible (student hub gate = internship_eligible)", () => {
  it("opens the hub at internship_eligible and beyond", () => {
    expect(isStudentInternshipEligible(null, "internship_eligible", "approved")).toBe(true);
    expect(isStudentInternshipEligible(null, "completed", "approved")).toBe(true);
  });
  it("keeps the hub closed before internship_eligible (e.g. just enrolled)", () => {
    expect(isStudentInternshipEligible(null, "enrolled", "approved")).toBe(false);
  });
  it("an explicit 'eligible' record grants access early", () => {
    expect(isStudentInternshipEligible("eligible", "enrolled", "approved")).toBe(true);
  });
  it("an explicit 'suspended' record always revokes access, even when stage-qualified", () => {
    expect(isStudentInternshipEligible("suspended", "internship_eligible", "approved")).toBe(false);
    expect(isStudentInternshipEligible("suspended", "completed", "approved")).toBe(false);
  });
  it("gate stage is internship_eligible", () => {
    expect(STUDENT_HUB_GATE_STAGE).toBe("internship_eligible");
  });
});
