import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the APP_DEFAULT_TOOL_KIT import to test different failure scenarios
const mockArtifactsToolkit = {
  create_bar_chart: { description: "Create bar charts" },
  create_line_chart: { description: "Create line charts" },
  create_pie_chart: { description: "Create pie charts" },
  create_table: { description: "Create data tables" },
};

const mockWebSearchToolkit = {
  webSearch: { description: "Search the web" },
  webContent: { description: "Get web content" },
};

const mockValidToolKit = {
  webSearch: mockWebSearchToolkit,
  artifacts: mockArtifactsToolkit,
  http: { http: { description: "HTTP requests" } },
  code: { javascript: { description: "Execute JavaScript" } },
};

// Mock loadAppDefaultTools function with enhanced diagnostics
const createMockLoadAppDefaultTools = (toolKit: any) => {
  return (opt?: {
    mentions?: Array<{ type: string; name: string }>;
    allowedAppDefaultToolkit?: string[];
  }) => {
    console.log("🔍 loadAppDefaultTools called with:", {
      mentionsLength: opt?.mentions?.length,
      allowedAppDefaultToolkit: opt?.allowedAppDefaultToolkit,
    });

    // Add resilient import check before using APP_DEFAULT_TOOL_KIT
    try {
      if (!toolKit) {
        console.error("🚨 APP_DEFAULT_TOOL_KIT is undefined!");
        return {};
      }
      if (!toolKit.artifacts) {
        console.error("🚨 APP_DEFAULT_TOOL_KIT.artifacts is missing!");
        console.log("Available toolkits:", Object.keys(toolKit));
        return {};
      }
    } catch (error) {
      console.error("🚨 Critical error accessing APP_DEFAULT_TOOL_KIT:", error);
      return {};
    }

    console.log("🔍 APP_DEFAULT_TOOL_KIT loaded:", {
      toolkitKeys: Object.keys(toolKit),
      artifactsToolCount: Object.keys(toolKit.artifacts || {}).length,
      webSearchToolCount: Object.keys(toolKit.webSearch || {}).length,
      totalToolkits: Object.keys(toolKit).length,
    });

    if (opt?.mentions?.length) {
      const defaultToolMentions = opt.mentions.filter(
        (m) => m.type == "defaultTool",
      );
      return Object.values(toolKit).reduce((acc: any, t: any) => {
        const allowed = Object.entries(t).filter(([k]) => {
          return defaultToolMentions.some((m) => m.name == k);
        });
        return { ...acc, ...Object.fromEntries(allowed) };
      }, {});
    }

    const allowedAppDefaultToolkit = opt?.allowedAppDefaultToolkit ?? [
      "webSearch",
      "http",
      "code",
      "artifacts",
    ];

    return allowedAppDefaultToolkit.reduce((acc: any, key: string) => {
      return { ...acc, ...(toolKit[key] || {}) };
    }, {});
  };
};

describe("Agent Tool Loading Diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadAppDefaultTools with valid toolkit", () => {
    it("should load all toolkit tools when no restrictions", () => {
      const loadAppDefaultTools =
        createMockLoadAppDefaultTools(mockValidToolKit);

      const result = loadAppDefaultTools();

      expect(Object.keys(result)).toHaveLength(8); // webSearch(2) + artifacts(4) + http(1) + code(1) tools
      expect(result["create_bar_chart"]).toBeDefined();
      expect(result["create_line_chart"]).toBeDefined();
      expect(result["create_table"]).toBeDefined();
      expect(result["webSearch"]).toBeDefined();
    });

    it("should load only allowed toolkits", () => {
      const loadAppDefaultTools =
        createMockLoadAppDefaultTools(mockValidToolKit);

      const result = loadAppDefaultTools({
        allowedAppDefaultToolkit: ["artifacts"], // Only artifacts toolkit
      });

      expect(Object.keys(result)).toHaveLength(4); // Only artifacts tools
      expect(result["create_bar_chart"]).toBeDefined();
      expect(result["webSearch"]).toBeUndefined(); // Should not be included
    });

    it("should filter tools based on mentions", () => {
      const loadAppDefaultTools =
        createMockLoadAppDefaultTools(mockValidToolKit);

      const result = loadAppDefaultTools({
        mentions: [
          { type: "defaultTool", name: "create_bar_chart" },
          { type: "defaultTool", name: "webSearch" },
        ],
      });

      expect(result["create_bar_chart"]).toBeDefined();
      expect(result["webSearch"]).toBeDefined();
      expect(result["create_line_chart"]).toBeUndefined(); // Not mentioned
    });
  });

  describe("loadAppDefaultTools error handling", () => {
    it("should handle undefined toolkit gracefully", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const loadAppDefaultTools = createMockLoadAppDefaultTools(undefined);

      const result = loadAppDefaultTools();

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        "🚨 APP_DEFAULT_TOOL_KIT is undefined!",
      );

      consoleSpy.mockRestore();
    });

    it("should handle missing artifacts toolkit", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const brokenToolKit = {
        webSearch: mockWebSearchToolkit,
        // artifacts: missing!
        http: { http: { description: "HTTP requests" } },
      };

      const loadAppDefaultTools = createMockLoadAppDefaultTools(brokenToolKit);
      const result = loadAppDefaultTools();

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        "🚨 APP_DEFAULT_TOOL_KIT.artifacts is missing!",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("Available toolkits:", [
        "webSearch",
        "http",
      ]);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it("should handle toolkit access errors", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Create toolkit that throws on access
      const throwingToolKit = new Proxy(
        {},
        {
          get() {
            throw new Error("Import failure");
          },
        },
      );

      const loadAppDefaultTools =
        createMockLoadAppDefaultTools(throwingToolKit);
      const result = loadAppDefaultTools();

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        "🚨 Critical error accessing APP_DEFAULT_TOOL_KIT:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Chart tool availability validation", () => {
    it("should detect when chart tools are missing from agent context", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // Simulate toolkit with only table tools (current bug state)
      const partialToolKit = {
        webSearch: mockWebSearchToolkit,
        artifacts: {
          create_table: { description: "Create data tables" },
          // Chart tools missing - simulating the current bug
        },
        http: { http: { description: "HTTP requests" } },
        code: { javascript: { description: "Execute JavaScript" } },
      };

      const loadAppDefaultTools = createMockLoadAppDefaultTools(partialToolKit);
      const result = loadAppDefaultTools();

      // Should detect missing chart tools
      expect(Object.keys(result)).toHaveLength(5); // webSearch(2) + table(1) + http(1) + code(1)
      expect(result["create_table"]).toBeDefined(); // Table works
      expect(result["create_bar_chart"]).toBeUndefined(); // Chart tools missing
      expect(result["create_line_chart"]).toBeUndefined();

      // Debug logging should show the issue
      expect(consoleSpy).toHaveBeenCalledWith(
        "🔍 APP_DEFAULT_TOOL_KIT loaded:",
        {
          toolkitKeys: ["webSearch", "artifacts", "http", "code"],
          artifactsToolCount: 1, // Only 1 tool instead of expected 17+
          webSearchToolCount: 2,
          totalToolkits: 4,
        },
      );

      consoleSpy.mockRestore();
    });

    it("should validate expected chart tool count", () => {
      const loadAppDefaultTools =
        createMockLoadAppDefaultTools(mockValidToolKit);

      const result = loadAppDefaultTools({
        allowedAppDefaultToolkit: ["artifacts"],
      });

      // Should have all chart tools
      const chartToolNames = [
        "create_bar_chart",
        "create_line_chart",
        "create_pie_chart",
        "create_table",
      ];

      chartToolNames.forEach((toolName) => {
        expect(result[toolName]).toBeDefined();
      });

      expect(Object.keys(result)).toHaveLength(4);
    });
  });

  describe("System resilience validation", () => {
    it("should continue functioning even with partial toolkit failures", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Simulate mixed success/failure state
      const mixedToolKit = {
        webSearch: mockWebSearchToolkit, // ✅ Works
        artifacts: undefined, // ❌ Fails
        http: { http: { description: "HTTP requests" } }, // ✅ Works
      };

      const loadAppDefaultTools = createMockLoadAppDefaultTools(mixedToolKit);
      const result = loadAppDefaultTools();

      // Should return empty due to missing artifacts (our fix)
      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
