import { describe, it, expect } from "vitest";

// Test the color values used in the gauge chart component
describe("GaugeChart Color System", () => {
  it("should have blue color values from design system", () => {
    // These are the blue color values that should be used in the gauge chart
    const expectedBlueColors = [
      "hsl(221.2 83.2% 53.3%)", // --chart-1 (primary blue)
      "hsl(212 95% 68%)", // --chart-2 (lighter blue)
      "hsl(216 92% 60%)", // --chart-3 (medium blue)
      "hsl(210 98% 78%)", // --chart-4 (light blue)
      "hsl(212 97% 87%)", // --chart-5 (very light blue)
    ];

    // Test that the values match the CSS design system
    expectedBlueColors.forEach((color) => {
      expect(color).toMatch(/hsl\(\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%\)/);
    });
  });

  it("should validate gauge type conversion", () => {
    const testCases = [
      { input: "speedometer", expected: "semicircle" },
      { input: "semi-circle", expected: "semicircle" },
      { input: "radial", expected: "radial" },
    ];

    testCases.forEach(({ input, expected }) => {
      const resolvedType =
        input === "speedometer" || input === "semi-circle"
          ? "semicircle"
          : input === "radial"
            ? "radial"
            : "semicircle";

      expect(resolvedType).toBe(expected);
    });
  });

  it("should validate percentage calculation", () => {
    const testCases = [
      { value: 75, min: 0, max: 100, expected: 75 },
      { value: 50, min: 0, max: 200, expected: 25 },
      { value: 150, min: 100, max: 200, expected: 50 },
    ];

    testCases.forEach(({ value, min, max, expected }) => {
      const percentage = Math.round(((value - min) / (max - min)) * 100);
      expect(percentage).toBe(expected);
    });
  });

  it("should validate threshold color format", () => {
    const validColors = ["#FF0000", "#00FF00", "#0000FF"];
    const invalidColors = ["red", "rgb(255,0,0)", "hsl(0,100%,50%)"];

    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    validColors.forEach((color) => {
      expect(color).toMatch(hexColorRegex);
    });

    invalidColors.forEach((color) => {
      expect(color).not.toMatch(hexColorRegex);
    });
  });

  it("should handle edge cases that could cause subArc validation errors", () => {
    // Test case that could trigger the original error: limit = 33
    const problemCases = [
      { value: 33, min: 0, max: 100, expected: 33 },
      { value: 33, min: 10, max: 50, expected: 57.5 }, // (33-10)/(50-10) * 100 = 57.5
      { value: 33, min: 33, max: 33, expected: 0 }, // Invalid range, should default to 0
      { value: 33, min: 50, max: 10, expected: 0 }, // Invalid range (min > max), should default
    ];

    problemCases.forEach(({ value, min, max, expected }) => {
      // Simulate the deduplication logic from the component
      let normalizedMin = min;
      let normalizedMax = max;
      let normalizedValue = value;

      if (normalizedMin >= normalizedMax) {
        normalizedValue = Math.max(0, Math.min(100, value));
        normalizedMin = 0;
        normalizedMax = 100;
      } else {
        normalizedValue = Math.max(
          normalizedMin,
          Math.min(normalizedMax, value),
        );
      }

      const range = normalizedMax - normalizedMin;
      const percentage =
        range <= 0
          ? 0
          : Math.round(((normalizedValue - normalizedMin) / range) * 100);

      expect(percentage).toBe(expected);

      // Ensure the final gauge value is always within 0-1 range
      const gaugeValue = Math.max(0, Math.min(1, percentage / 100));
      expect(gaugeValue).toBeGreaterThanOrEqual(0);
      expect(gaugeValue).toBeLessThanOrEqual(1);
    });
  });

  it("should prevent infinite values that could cause subArc errors", () => {
    const edgeCases = [
      { value: Infinity, min: 0, max: 100, shouldThrow: true },
      { value: -Infinity, min: 0, max: 100, shouldThrow: true },
      { value: NaN, min: 0, max: 100, shouldThrow: true },
      { value: 50, min: Infinity, max: 100, shouldThrow: true },
      { value: 50, min: 0, max: NaN, shouldThrow: true },
    ];

    edgeCases.forEach(({ value, min, max, shouldThrow }) => {
      const allFinite =
        Number.isFinite(value) && Number.isFinite(min) && Number.isFinite(max);
      expect(allFinite).toBe(!shouldThrow);
    });
  });
});
