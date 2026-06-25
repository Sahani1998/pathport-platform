import {
  canTransition,
  ALLOWED_TRANSITIONS,
  isTerminalStage,
  TERMINAL_STAGES,
  getStageProgress,
  STAGE_PROGRESS,
} from "@/lib/application-workflow";
import type { ApplicationStage } from "@/types/timeline";

const ALL_STAGES = Object.keys(ALLOWED_TRANSITIONS) as ApplicationStage[];

describe("canTransition", () => {
  it("returns false for same-stage self-transition", () => {
    ALL_STAGES.forEach(stage => {
      expect(canTransition(stage, stage)).toBe(false);
    });
  });

  it("returns true for every listed allowed transition", () => {
    ALL_STAGES.forEach(from => {
      ALLOWED_TRANSITIONS[from].forEach(to => {
        expect(canTransition(from, to)).toBe(true);
      });
    });
  });

  it("returns false for unlisted transitions", () => {
    // completed has no outgoing transitions
    expect(canTransition("completed", "enrolled")).toBe(false);
    expect(canTransition("completed", "application_submitted")).toBe(false);
    // Cannot skip straight from submitted to enrolled
    expect(canTransition("application_submitted", "enrolled")).toBe(false);
  });

  it("allows rejected from early-mid pipeline stages", () => {
    // Stages through 'approved' all allow rejection.
    // Late stages (enrolled, internship_eligible) do not — they are considered
    // committed and only advance to completed.
    const stagesAllowingRejection: ApplicationStage[] = [
      "application_submitted", "documents_pending", "documents_uploaded",
      "documents_under_review", "documents_verified", "offer_letter_processing",
      "offer_letter_ready", "offer_letter_accepted", "fee_payment_pending",
      "ipa_processing", "approved", "tuition_fee_payment_pending",
      "arrival_preparation", "arrived_singapore",
    ];
    stagesAllowingRejection.forEach(stage => {
      expect(canTransition(stage, "rejected")).toBe(true);
    });
  });

  it("does not allow rejected from enrolled or internship_eligible", () => {
    expect(canTransition("enrolled", "rejected")).toBe(false);
    expect(canTransition("internship_eligible", "rejected")).toBe(false);
  });

  it("allows admin re-open from rejected to application_submitted", () => {
    expect(canTransition("rejected", "application_submitted")).toBe(true);
  });
});

describe("isTerminalStage", () => {
  it("identifies the three terminal stages correctly", () => {
    expect(isTerminalStage("completed")).toBe(true);
    expect(isTerminalStage("rejected")).toBe(true);
    expect(isTerminalStage("withdrawn")).toBe(true);
  });

  it("does not flag active stages as terminal", () => {
    expect(isTerminalStage("enrolled")).toBe(false);
    expect(isTerminalStage("application_submitted")).toBe(false);
    expect(isTerminalStage("ipa_processing")).toBe(false);
  });
});

describe("getStageProgress", () => {
  it("returns 100 for all completion stages", () => {
    expect(getStageProgress("enrolled")).toBe(100);
    expect(getStageProgress("internship_eligible")).toBe(100);
    expect(getStageProgress("completed")).toBe(100);
  });

  it("returns 0 for terminal negative stages", () => {
    expect(getStageProgress("rejected")).toBe(0);
    expect(getStageProgress("withdrawn")).toBe(0);
  });

  it("returns a non-decreasing value along the happy path", () => {
    const happyPath: ApplicationStage[] = [
      "application_submitted",
      "documents_pending",
      "documents_uploaded",
      "documents_under_review",
      "documents_verified",
      "offer_letter_processing",
      "offer_letter_ready",
      "offer_letter_accepted",
      "fee_payment_pending",
      "ipa_processing",
      "approved",
      "arrival_preparation",
      "arrived_singapore",
      "enrolled",
    ];
    for (let i = 1; i < happyPath.length; i++) {
      expect(getStageProgress(happyPath[i])).toBeGreaterThanOrEqual(
        getStageProgress(happyPath[i - 1]),
      );
    }
  });

  it("covers all stages in STAGE_PROGRESS", () => {
    ALL_STAGES.forEach(stage => {
      expect(STAGE_PROGRESS[stage]).toBeDefined();
    });
  });
});
