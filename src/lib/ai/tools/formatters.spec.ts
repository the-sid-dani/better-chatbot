import { describe, it, expect } from "vitest";
import {
  formatToolResult,
  exaFormatter,
  chartTableFormatter,
  httpFormatter,
} from "./formatters";

describe("voice tool formatter registry", () => {
  it("formats exa search results into concise bullets", () => {
    const result = exaFormatter({
      results: [
        {
          title: "Example Article",
          url: "https://example.com",
          publishedDate: "2025-01-01T00:00:00.000Z",
          text: "This is an example article body …",
        },
      ],
    });
    expect(result.summaryForModel).toContain("Example Article");
    expect(result.summaryForModel).toContain("https://example.com");
  });

  it("formats chart/table outputs with counts", () => {
    const result = chartTableFormatter({
      title: "Sales",
      chartType: "bar",
      chartData: { data: [{ a: 1 }, { a: 2 }], columns: ["a"] },
    });
    expect(result.summaryForModel).toContain("bar");
    expect(result.summaryForModel).toContain("data points");
  });

  it("formats http outputs with status and keys", () => {
    const result = httpFormatter({
      status: 200,
      headers: { "content-type": "application/json" },
      body: { a: 1, b: 2, c: 3 },
    });
    expect(result.summaryForModel).toContain("HTTP 200");
    expect(result.summaryForModel).toContain("Keys:");
  });

  it("registry returns generic fallback for unknown tools", () => {
    const out = formatToolResult("unknown_tool", {
      foo: "bar",
      baz: [1, 2, 3],
    });
    expect(out.summaryForModel).toContain("Object with keys");
  });
});
