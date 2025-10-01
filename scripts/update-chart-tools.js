#!/usr/bin/env node

/**
 * DEPRECATED - This script was used during the chart tools migration (Sept 2025)
 *
 * Historical Purpose:
 * - Updated chart artifact tools to use direct chartData format
 * - Migrated from structuredContent format with JSON.stringify
 * - Aligned all 16 specialized chart tools with unified Canvas integration pattern
 *
 * Status: All migrations complete. Script kept for historical reference only.
 *
 * Current Chart Tools (17 total):
 * - 16 specialized: bar, line, pie, area, scatter, radar, funnel, treemap,
 *   sankey, radial_bar, composed, geographic, gauge, calendar_heatmap, table, radial_bar
 * - 1 orchestrator: dashboard-orchestrator
 *
 * Removed Tools (deprecated Sept 2025):
 * - create_chart (generic catch-all)
 * - update_chart (generic catch-all)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOOLS_DIR = path.join(__dirname, "../src/lib/ai/tools/artifacts");

// Tools to update (excluding bar, line, pie which are already done)
const TOOLS_TO_UPDATE = [
  "area-chart-tool.ts",
  "scatter-chart-tool.ts",
  "radar-chart-tool.ts",
  "funnel-chart-tool.ts",
  "treemap-chart-tool.ts",
  "sankey-chart-tool.ts",
  "composed-chart-tool.ts",
  "geographic-chart-tool.ts",
  "gauge-chart-tool.ts",
  "table-artifact-tool.ts",
];

// Chart type mapping
const CHART_TYPE_MAP = {
  "area-chart-tool.ts": "area",
  "scatter-chart-tool.ts": "scatter",
  "radar-chart-tool.ts": "radar",
  "funnel-chart-tool.ts": "funnel",
  "treemap-chart-tool.ts": "treemap",
  "sankey-chart-tool.ts": "sankey",
  "composed-chart-tool.ts": "composed",
  "geographic-chart-tool.ts": "geographic",
  "gauge-chart-tool.ts": "gauge",
  "table-artifact-tool.ts": "table",
};

function updateToolFile(filePath, chartType) {
  console.log(`\n📝 Updating ${path.basename(filePath)}...`);

  let content = fs.readFileSync(filePath, "utf8");

  // Pattern 1: Find and replace the structured result data section
  const structuredResultPattern =
    /\/\/ Generate unique artifact ID\s+const artifactId = generateUUID\(\);\s+\/\/ Create the structured result data[\s\S]*?return \{[\s\S]*?structuredContent:[\s\S]*?\},[\s\S]*?isError: false,[\s\S]*?\};/;

  if (structuredResultPattern.test(content)) {
    console.log(`  ✅ Found structured result pattern`);

    // Create the replacement based on chart type
    const isTable = chartType === "table";
    const replacement = `// Generate unique artifact ID
      const artifactId = generateUUID();

      // Stream success state with direct chartData format (matches create_chart pattern)
      yield {
        status: "success" as const,
        message: \`Created ${isTable ? "table" : chartType + " chart"} "\${title}"\`,
        chartId: artifactId,
        title,
        chartType: "${chartType}",
        canvasName: canvasName || "Data Visualization",
        chartData: chartContent,
        shouldCreateArtifact: true, // Flag for Canvas processing
        progress: 100,
      };

      // Return simple success message for chat
      logger.info(\`${isTable ? "Table" : chartType.charAt(0).toUpperCase() + chartType.slice(1) + " chart"} artifact created successfully: \${artifactId}\`);
      return \`Created ${isTable ? "table" : chartType + " chart"} "\${title}". The ${isTable ? "table" : "chart"} is now available in the Canvas workspace.\`;`;

    content = content.replace(structuredResultPattern, replacement);
    console.log(`  ✅ Replaced structured result with direct format`);
  } else {
    console.log(`  ⚠️  Pattern not found - manual review needed`);
    return false;
  }

  // Write back
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`  ✅ File updated successfully`);
  return true;
}

function main() {
  console.log("🚀 Starting chart tools update script...\n");
  console.log(`📂 Tools directory: ${TOOLS_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const toolFile of TOOLS_TO_UPDATE) {
    const filePath = path.join(TOOLS_DIR, toolFile);
    const chartType = CHART_TYPE_MAP[toolFile];

    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${toolFile}`);
      failCount++;
      continue;
    }

    try {
      const success = updateToolFile(filePath, chartType);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.log(`  ❌ Error updating file: ${error.message}`);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Successfully updated: ${successCount} files`);
  console.log(`  ❌ Failed: ${failCount} files`);
  console.log(`  📝 Total processed: ${TOOLS_TO_UPDATE.length} files`);

  if (failCount > 0) {
    console.log(`\n⚠️  Some files require manual review`);
    process.exit(1);
  } else {
    console.log(`\n✨ All files updated successfully!`);
    process.exit(0);
  }
}

main();
