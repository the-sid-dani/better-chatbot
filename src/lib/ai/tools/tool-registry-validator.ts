/**
 * Centralized Tool Registry Validation Utilities
 *
 * This module provides comprehensive validation functions to prevent tool registration
 * inconsistencies and provide clear debugging information for chart tool issues.
 *
 * Used by:
 * - tool-kit.ts for runtime validation
 * - Development debugging tools
 * - Test suites for ensuring tool registry consistency
 */

import { Tool } from "ai";
import { AppDefaultToolkit, DefaultToolName } from "./index";
import logger from "../../logger";

// Note: APP_DEFAULT_TOOL_KIT import removed to prevent circular dependency
// These utilities can be used by calling them with the toolkit as a parameter

export interface ToolValidationResult {
  isValid: boolean;
  enumCount: number;
  registeredCount: number;
  missing: string[];
  extra: string[];
  inconsistencies: ToolInconsistency[];
  warnings: string[];
  errors: string[];
}

export interface ToolInconsistency {
  type:
    | "missing_tool"
    | "extra_tool"
    | "name_mismatch"
    | "invalid_tool_structure";
  toolName: string;
  expectedName?: string;
  actualName?: string;
  severity: "error" | "warning";
  message: string;
}

export interface ChartToolValidationResult {
  isValid: boolean;
  expectedChartTools: string[];
  registeredChartTools: string[];
  missingChartTools: string[];
  extraChartTools: string[];
  chartToolsWithNames: { [toolName: string]: string | undefined };
}

/**
 * Comprehensive validation of the entire tool registry
 */
export const validateToolRegistry = (
  toolkit: Record<AppDefaultToolkit, Record<string, Tool>>,
): ToolValidationResult => {
  const allEnumValues = Object.values(DefaultToolName);
  const allRegisteredTools: string[] = [];
  const inconsistencies: ToolInconsistency[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Collect all registered tool names from all toolkits
  Object.entries(toolkit).forEach(([_toolkitName, toolkitTools]) => {
    const toolNames = Object.keys(toolkitTools);
    allRegisteredTools.push(...toolNames);

    // Validate each tool in the toolkit
    Object.entries(toolkitTools).forEach(([toolName, tool]) => {
      validateIndividualTool(toolName, tool, inconsistencies, warnings);
    });
  });

  // Find missing and extra tools
  const missingTools = allEnumValues.filter(
    (enumValue) => !allRegisteredTools.includes(enumValue),
  );
  const extraTools = allRegisteredTools.filter(
    (registered) =>
      !allEnumValues.some((enumValue) => enumValue === registered),
  );

  // Add missing tools as errors
  missingTools.forEach((missing) => {
    inconsistencies.push({
      type: "missing_tool",
      toolName: missing,
      severity: "error",
      message: `Tool '${missing}' is defined in DefaultToolName enum but not registered in APP_DEFAULT_TOOL_KIT`,
    });
    errors.push(`Missing tool implementation: ${missing}`);
  });

  // Add extra tools as warnings
  extraTools.forEach((extra) => {
    inconsistencies.push({
      type: "extra_tool",
      toolName: extra,
      severity: "warning",
      message: `Tool '${extra}' is registered but not defined in DefaultToolName enum`,
    });
    warnings.push(`Extra tool registration: ${extra}`);
  });

  const result: ToolValidationResult = {
    isValid:
      missingTools.length === 0 &&
      inconsistencies.filter((i) => i.severity === "error").length === 0,
    enumCount: allEnumValues.length,
    registeredCount: allRegisteredTools.length,
    missing: missingTools,
    extra: extraTools,
    inconsistencies,
    warnings,
    errors,
  };

  return result;
};

/**
 * Validate individual tool structure and properties
 */
const validateIndividualTool = (
  toolName: string,
  tool: Tool,
  inconsistencies: ToolInconsistency[],
  warnings: string[],
): void => {
  // Check if tool has proper structure
  if (!tool || typeof tool !== "object") {
    inconsistencies.push({
      type: "invalid_tool_structure",
      toolName,
      severity: "error",
      message: `Tool '${toolName}' has invalid structure (not an object)`,
    });
    return;
  }

  // Check if tool has required properties
  if (!tool.description) {
    warnings.push(`Tool '${toolName}' missing description`);
  }

  if (!tool.inputSchema) {
    warnings.push(`Tool '${toolName}' missing inputSchema`);
  }

  if (!tool.execute) {
    inconsistencies.push({
      type: "invalid_tool_structure",
      toolName,
      severity: "error",
      message: `Tool '${toolName}' missing execute function`,
    });
  }

  // Check for explicit name property (recommended for debugging)
  if ("name" in tool && tool.name && tool.name !== toolName) {
    inconsistencies.push({
      type: "name_mismatch",
      toolName,
      expectedName: toolName,
      actualName: tool.name as string,
      severity: "warning",
      message: `Tool '${toolName}' has explicit name property '${tool.name}' that doesn't match registry key`,
    });
  }
};

/**
 * Specific validation for chart tools
 */
export const validateChartTools = (
  toolkit: Record<AppDefaultToolkit, Record<string, Tool>>,
): ChartToolValidationResult => {
  const chartEnumValues = Object.values(DefaultToolName).filter((name) =>
    name.includes("chart"),
  );
  const artifactTools = Object.keys(toolkit[AppDefaultToolkit.Artifacts] || {});
  const registeredChartTools = artifactTools.filter((name) =>
    name.includes("chart"),
  );

  const missingChartTools = chartEnumValues.filter(
    (enumValue) => !registeredChartTools.includes(enumValue),
  );
  const extraChartTools = registeredChartTools.filter(
    (registered) =>
      !chartEnumValues.some((enumValue) => enumValue === registered),
  );

  // Check if chart tools have explicit name properties
  const chartToolsWithNames: { [toolName: string]: string | undefined } = {};
  registeredChartTools.forEach((toolName) => {
    const tool = toolkit[AppDefaultToolkit.Artifacts]?.[toolName];
    chartToolsWithNames[toolName] = (tool as any)?.name || undefined;
  });

  return {
    isValid: missingChartTools.length === 0,
    expectedChartTools: chartEnumValues,
    registeredChartTools,
    missingChartTools,
    extraChartTools,
    chartToolsWithNames,
  };
};

/**
 * Validate specific toolkit
 */
export const validateToolkit = (
  allToolkits: Record<AppDefaultToolkit, Record<string, Tool>>,
  toolkitName: AppDefaultToolkit,
): ToolValidationResult => {
  const toolkit = allToolkits[toolkitName];
  if (!toolkit) {
    return {
      isValid: false,
      enumCount: 0,
      registeredCount: 0,
      missing: [],
      extra: [],
      inconsistencies: [
        {
          type: "missing_tool",
          toolName: toolkitName,
          severity: "error",
          message: `Toolkit '${toolkitName}' not found in toolkit registry`,
        },
      ],
      warnings: [],
      errors: [`Toolkit '${toolkitName}' not found`],
    };
  }

  const toolNames = Object.keys(toolkit);
  const inconsistencies: ToolInconsistency[] = [];
  const warnings: string[] = [];

  // Validate each tool in the specific toolkit
  Object.entries(toolkit).forEach(([toolName, tool]) => {
    validateIndividualTool(toolName, tool, inconsistencies, warnings);
  });

  return {
    isValid: inconsistencies.filter((i) => i.severity === "error").length === 0,
    enumCount: toolNames.length,
    registeredCount: toolNames.length,
    missing: [],
    extra: [],
    inconsistencies,
    warnings,
    errors: inconsistencies
      .filter((i) => i.severity === "error")
      .map((i) => i.message),
  };
};

/**
 * Generate detailed debugging report for tool registry issues
 */
export const generateToolRegistryReport = (
  toolkit: Record<AppDefaultToolkit, Record<string, Tool>>,
): string => {
  const validation = validateToolRegistry(toolkit);
  const chartValidation = validateChartTools(toolkit);

  let report = "🔍 Tool Registry Validation Report\n";
  report += "=====================================\n\n";

  // Overall status
  report += `Overall Status: ${validation.isValid ? "✅ PASSED" : "❌ FAILED"}\n`;
  report += `Total Enum Entries: ${validation.enumCount}\n`;
  report += `Total Registered Tools: ${validation.registeredCount}\n`;
  report += `Errors: ${validation.errors.length}\n`;
  report += `Warnings: ${validation.warnings.length}\n\n`;

  // Missing tools (critical errors)
  if (validation.missing.length > 0) {
    report += "🚨 MISSING TOOLS (Critical Errors):\n";
    validation.missing.forEach((missing) => {
      report += `  - ${missing}\n`;
    });
    report += "\n";
  }

  // Extra tools (warnings)
  if (validation.extra.length > 0) {
    report += "⚠️ EXTRA TOOLS (Warnings):\n";
    validation.extra.forEach((extra) => {
      report += `  - ${extra}\n`;
    });
    report += "\n";
  }

  // Chart tools specific report
  report += "📊 Chart Tools Analysis:\n";
  report += `Expected Chart Tools: ${chartValidation.expectedChartTools.length}\n`;
  report += `Registered Chart Tools: ${chartValidation.registeredChartTools.length}\n`;
  report += `Chart Tools Valid: ${chartValidation.isValid ? "✅" : "❌"}\n`;

  if (chartValidation.missingChartTools.length > 0) {
    report += "Missing Chart Tools:\n";
    chartValidation.missingChartTools.forEach((missing) => {
      report += `  - ${missing}\n`;
    });
  }

  // Inconsistencies
  if (validation.inconsistencies.length > 0) {
    report += "\n🔧 Tool Inconsistencies:\n";
    validation.inconsistencies.forEach((issue) => {
      const icon = issue.severity === "error" ? "❌" : "⚠️";
      report += `  ${icon} [${issue.type}] ${issue.toolName}: ${issue.message}\n`;
    });
  }

  // Recommendations
  report += "\n💡 Recommendations:\n";
  if (validation.missing.length > 0) {
    report += "  - Add missing tool implementations to APP_DEFAULT_TOOL_KIT\n";
  }
  if (validation.extra.length > 0) {
    report +=
      "  - Consider adding extra tools to DefaultToolName enum or removing from registry\n";
  }
  if (chartValidation.missingChartTools.length > 0) {
    report +=
      "  - Implement missing chart tools with proper streaming patterns\n";
  }

  return report;
};

/**
 * Log comprehensive tool registry status
 */
export const logToolRegistryStatus = (
  toolkit: Record<AppDefaultToolkit, Record<string, Tool>>,
): void => {
  const validation = validateToolRegistry(toolkit);
  const chartValidation = validateChartTools(toolkit);

  logger.info("🔍 Tool Registry Validation Results:", {
    isValid: validation.isValid,
    enumCount: validation.enumCount,
    registeredCount: validation.registeredCount,
    missingCount: validation.missing.length,
    extraCount: validation.extra.length,
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
  });

  logger.info("📊 Chart Tool Validation Results:", {
    expectedChartTools: chartValidation.expectedChartTools.length,
    registeredChartTools: chartValidation.registeredChartTools.length,
    missingChartTools: chartValidation.missingChartTools.length,
    isValid: chartValidation.isValid,
  });

  // Log errors
  if (validation.errors.length > 0) {
    logger.error("🚨 Tool Registry Errors:", validation.errors);
  }

  // Log warnings
  if (validation.warnings.length > 0) {
    logger.warn("⚠️ Tool Registry Warnings:", validation.warnings);
  }

  // Log missing chart tools specifically
  if (chartValidation.missingChartTools.length > 0) {
    logger.error("🚨 Missing Chart Tools:", chartValidation.missingChartTools);
  }
};

/**
 * Throw error if tool registry validation fails (for startup validation)
 */
export const assertToolRegistryValid = (
  toolkit: Record<AppDefaultToolkit, Record<string, Tool>>,
): void => {
  const validation = validateToolRegistry(toolkit);

  if (!validation.isValid) {
    const errorMessage = `Tool Registry Validation Failed: ${validation.errors.join(", ")}`;
    logger.error("💥 Tool Registry Validation Failed - System Startup Aborted");
    throw new Error(errorMessage);
  }

  logger.info("✅ Tool Registry Validation Passed - System Ready");
};
