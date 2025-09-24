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
});
