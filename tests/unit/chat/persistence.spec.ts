import { describe, expect, it } from "vitest";
import { isToolUIPart } from "ai";

import {
  ensureAssistantMessageHasRenderableParts,
  normalizeToolUIPartFromHistory,
  buildAssistantErrorStub,
} from "@/app/api/chat/shared.chat";
import type { UIMessage } from "ai";

describe("chat persistence safeguards", () => {
  it("adds a fallback text part when an assistant message has no renderable parts", () => {
    const emptyAssistant: UIMessage = {
      id: "assistant-1",
      role: "assistant",
      parts: [],
    };

    const { message, fallbackApplied } =
      ensureAssistantMessageHasRenderableParts(emptyAssistant, "(fallback)");

    expect(fallbackApplied).toBe(true);
    expect(message.parts).toHaveLength(1);
    expect(message.parts[0]).toMatchObject({
      type: "text",
      text: "(fallback)",
    });
  });

  it("normalizes tool-only parts with empty input so they replay after refresh", () => {
    const toolPart = {
      type: "tool-create_chart",
      toolCallId: undefined,
      input: {},
      output: { chartData: { points: [] } },
      state: "call",
    };

    const { part: normalized, changed } = normalizeToolUIPartFromHistory(
      toolPart as any,
    );

    expect(changed).toBe(true);
    expect(isToolUIPart(normalized)).toBe(true);
    expect((normalized as any).state).toBe("output-available");
    expect((normalized as any).providerExecuted).toBe(true);
    expect((normalized as any).toolCallId).toBeTruthy();
    expect((normalized as any).output).toEqual(toolPart.output);
  });

  it("builds an assistant error stub that preserves metadata for history reloads", () => {
    const { message, metadata, persistedAt } = buildAssistantErrorStub(
      {
        toolChoice: "auto",
      },
      {
        type: "invalid_tool_arguments",
        message: "Invalid chart spec",
        details: { field: "chartType" },
      },
    );

    expect(message.role).toBe("assistant");
    expect(message.parts).toHaveLength(1);
    expect(message.parts[0]).toMatchObject({
      type: "text",
      text: "The assistant encountered an error and could not complete the response.",
    });
    expect(metadata.toolChoice).toBe("auto");
    expect(metadata.errorInfo).toMatchObject({
      type: "invalid_tool_arguments",
      message: "Invalid chart spec",
      details: { field: "chartType" },
    });
    expect(metadata.errorInfo?.persistedAt).toBe(persistedAt);
    expect(Number.isNaN(Date.parse(persistedAt))).toBe(false);
  });
});
