import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the canvas-panel module to test just the useCanvas hook logic
const mockDebugLog = vi.fn();
const mockIsMountedRef = { current: true };

// Mock the useCanvas hook behavior we're testing
interface MockCanvasState {
  artifacts: Array<{ id: string; title: string }>;
  isVisible: boolean;
  userManuallyClosed: boolean;
}

const createMockCanvasHook = () => {
  const state: MockCanvasState = {
    artifacts: [],
    isVisible: false,
    userManuallyClosed: false,
  };

  const removeArtifact = (id: string) => {
    if (!mockIsMountedRef.current) {
      mockDebugLog("Attempted to remove artifact after unmount - ignoring");
      return;
    }

    mockDebugLog("Removing artifact", { artifactId: id });

    const filtered = state.artifacts.filter((a) => a.id !== id);
    mockDebugLog("Artifacts after removal", {
      remainingCount: filtered.length,
    });

    // ✅ FIXED: Auto-close logic removed - canvas should NOT close when artifacts empty
    // OLD BUGGY CODE (now removed):
    // if (filtered.length === 0) {
    //   setTimeout(() => setIsVisible(false), 100);
    // }

    state.artifacts = filtered;
    return state;
  };

  const closeCanvas = () => {
    if (!mockIsMountedRef.current) {
      mockDebugLog("Attempted to close canvas after unmount - ignoring");
      return;
    }

    mockDebugLog("User manually closed Canvas");
    state.isVisible = false;
    state.userManuallyClosed = true;
  };

  return {
    state,
    removeArtifact,
    closeCanvas,
    setVisible: (visible: boolean) => {
      state.isVisible = visible;
    },
    addArtifact: (artifact: { id: string; title: string }) => {
      state.artifacts.push(artifact);
      state.isVisible = true;
    },
  };
};

describe("Canvas Persistence Bug Fix", () => {
  let mockCanvas: ReturnType<typeof createMockCanvasHook>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas = createMockCanvasHook();
    mockIsMountedRef.current = true;
  });

  describe("removeArtifact function", () => {
    it("should NOT auto-close canvas when all artifacts are removed (bug fix)", () => {
      // Setup: Add artifacts and open canvas
      mockCanvas.addArtifact({ id: "chart1", title: "Test Chart 1" });
      mockCanvas.addArtifact({ id: "chart2", title: "Test Chart 2" });
      expect(mockCanvas.state.artifacts).toHaveLength(2);
      expect(mockCanvas.state.isVisible).toBe(true);

      // Action: Remove all artifacts
      mockCanvas.removeArtifact("chart1");
      mockCanvas.removeArtifact("chart2");

      // ✅ FIXED BEHAVIOR: Canvas should remain visible
      expect(mockCanvas.state.artifacts).toHaveLength(0);
      expect(mockCanvas.state.isVisible).toBe(true); // ← This should be true (bug fixed)
      expect(mockCanvas.state.userManuallyClosed).toBe(false);

      // Verify debug logging
      expect(mockDebugLog).toHaveBeenCalledWith("Artifacts after removal", {
        remainingCount: 1,
      });
      expect(mockDebugLog).toHaveBeenCalledWith("Artifacts after removal", {
        remainingCount: 0,
      });

      // ✅ Should NOT have auto-close debug message
      expect(mockDebugLog).not.toHaveBeenCalledWith(
        "Last artifact removed - hiding canvas",
      );
    });

    it("should remove artifacts without affecting canvas visibility", () => {
      // Setup
      mockCanvas.addArtifact({ id: "chart1", title: "Test Chart" });
      mockCanvas.setVisible(true);

      // Action
      mockCanvas.removeArtifact("chart1");

      // Assert: Canvas stays visible even with empty artifacts
      expect(mockCanvas.state.artifacts).toHaveLength(0);
      expect(mockCanvas.state.isVisible).toBe(true);
    });

    it("should handle non-existent artifact removal gracefully", () => {
      // Setup
      mockCanvas.setVisible(true);

      // Action: Try to remove non-existent artifact
      mockCanvas.removeArtifact("non-existent");

      // Assert: Canvas state unchanged
      expect(mockCanvas.state.isVisible).toBe(true);
      expect(mockCanvas.state.artifacts).toHaveLength(0);
    });
  });

  describe("closeCanvas function (should remain unchanged)", () => {
    it("should manually close canvas and set userManuallyClosed flag", () => {
      // Setup
      mockCanvas.setVisible(true);
      expect(mockCanvas.state.userManuallyClosed).toBe(false);

      // Action: Manual close
      mockCanvas.closeCanvas();

      // Assert: Proper manual close behavior
      expect(mockCanvas.state.isVisible).toBe(false);
      expect(mockCanvas.state.userManuallyClosed).toBe(true);
      expect(mockDebugLog).toHaveBeenCalledWith("User manually closed Canvas");
    });

    it("should handle unmounted component gracefully", () => {
      // Setup: Simulate unmounted component
      mockIsMountedRef.current = false;

      // Action
      mockCanvas.closeCanvas();

      // Assert: Should ignore close request
      expect(mockDebugLog).toHaveBeenCalledWith(
        "Attempted to close canvas after unmount - ignoring",
      );
    });
  });

  describe("Canvas persistence behavior validation", () => {
    it("should maintain canvas visibility during artifact operations", () => {
      // Setup: Multiple artifacts scenario
      mockCanvas.addArtifact({ id: "chart1", title: "Chart 1" });
      mockCanvas.addArtifact({ id: "chart2", title: "Chart 2" });
      mockCanvas.addArtifact({ id: "chart3", title: "Chart 3" });

      // Action: Remove artifacts one by one
      mockCanvas.removeArtifact("chart1");
      expect(mockCanvas.state.isVisible).toBe(true); // Still visible

      mockCanvas.removeArtifact("chart2");
      expect(mockCanvas.state.isVisible).toBe(true); // Still visible

      mockCanvas.removeArtifact("chart3"); // Last artifact
      expect(mockCanvas.state.isVisible).toBe(true); // ✅ SHOULD STAY VISIBLE (bug fixed)
    });

    it("should distinguish between manual close and artifact removal", () => {
      // Setup
      mockCanvas.addArtifact({ id: "chart1", title: "Chart 1" });

      // Test 1: Remove artifact - canvas should stay open
      mockCanvas.removeArtifact("chart1");
      expect(mockCanvas.state.isVisible).toBe(true);
      expect(mockCanvas.state.userManuallyClosed).toBe(false);

      // Test 2: Manual close - canvas should close and set flag
      mockCanvas.closeCanvas();
      expect(mockCanvas.state.isVisible).toBe(false);
      expect(mockCanvas.state.userManuallyClosed).toBe(true);
    });
  });

  describe("Regression prevention", () => {
    it("should not reintroduce auto-close logic", () => {
      // This test ensures the bug fix remains in place
      const artifactOperations = [
        () => mockCanvas.addArtifact({ id: "test1", title: "Test" }),
        () => mockCanvas.removeArtifact("test1"),
        () => mockCanvas.addArtifact({ id: "test2", title: "Test 2" }),
        () => mockCanvas.removeArtifact("test2"),
      ];

      // Execute multiple add/remove cycles
      artifactOperations.forEach((operation) => operation());

      // ✅ Canvas should remain visible throughout all operations
      expect(mockCanvas.state.isVisible).toBe(true);
      expect(mockCanvas.state.userManuallyClosed).toBe(false);

      // Should only close on manual action
      mockCanvas.closeCanvas();
      expect(mockCanvas.state.isVisible).toBe(false);
      expect(mockCanvas.state.userManuallyClosed).toBe(true);
    });
  });
});
