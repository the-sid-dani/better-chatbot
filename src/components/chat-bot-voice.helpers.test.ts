import { describe, expect, it } from "vitest";

import {
  addCompletedToolIdsToDismissed,
  isVoiceToolExecutingState,
} from "./chat-bot-voice.helpers";

describe("voice tool helpers", () => {
  describe("isVoiceToolExecutingState", () => {
    it("treats call state as executing", () => {
      expect(isVoiceToolExecutingState("call")).toBe(true);
    });

    it("treats input-prefixed states as executing", () => {
      expect(isVoiceToolExecutingState("input-pending")).toBe(true);
    });

    it("ignores non-executing states", () => {
      expect(isVoiceToolExecutingState("output-available")).toBe(false);
    });
  });

  describe("addCompletedToolIdsToDismissed", () => {
    it("preserves previous dismissed ids and skips the latest completed id", () => {
      const prev = new Set<string>(["existing"]);
      const completedIds = ["existing", "latest"];

      const result = addCompletedToolIdsToDismissed(
        prev,
        completedIds,
        "latest",
        10,
      );

      expect(result.has("existing")).toBe(true);
      expect(result.has("latest")).toBe(false);
    });

    it("prunes oldest ids when exceeding max size", () => {
      const prev = new Set<string>();
      const completedIds = ["id1", "id2", "id3"];

      const result = addCompletedToolIdsToDismissed(
        prev,
        completedIds,
        "id3",
        1,
      );

      expect(result.has("id2")).toBe(true);
      expect(result.has("id1")).toBe(false);
    });
  });
});
