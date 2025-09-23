import { generateText } from "ai";
import { customModelProvider } from "./models";

interface CanvasArtifact {
  id: string;
  type: string;
  title: string;
  data?: any;
  metadata?: any;
}

// LLM-based Canvas naming system
export async function generateCanvasName(artifacts: CanvasArtifact[]): Promise<string> {
  if (artifacts.length === 0) return "Canvas";

  try {
    // Extract chart information for LLM analysis
    const chartInfo = artifacts.map(artifact => ({
      title: artifact.title,
      type: artifact.type,
      chartType: artifact.metadata?.chartType,
      dataPoints: artifact.metadata?.dataPoints,
    }));

    const chartDescriptions = chartInfo.map(chart =>
      `${chart.title} (${chart.chartType || chart.type} chart, ${chart.dataPoints || 0} data points)`
    ).join(", ");

    // Use LLM to generate contextual dashboard name
    const model = customModelProvider.getModel("gpt-4.1");

    const result = await generateText({
      model,
      prompt: `You are a dashboard naming expert. Given the following charts in a data visualization dashboard, generate a concise, professional dashboard name (2-4 words max) that best describes the overall theme and purpose.

Charts: ${chartDescriptions}

Generate a dashboard name that:
- Captures the main theme/domain (e.g., "Global Market Analytics", "Sales Performance", "Financial Overview")
- Is professional and concise (2-4 words)
- Avoids generic terms like "Dashboard" or "Data" unless necessary
- Reflects the specific data domain

Examples of good names:
- For population and demographic charts: "Global Demographics"
- For sales and revenue charts: "Sales Analytics"
- For market share and competition data: "Market Intelligence"
- For mixed business data: "Business Overview"

Dashboard Name:`,
      maxTokens: 20,
      temperature: 0.7,
    });

    const generatedName = result.text.trim().replace(/['"]/g, '');

    // Validate the generated name (fallback to current system if invalid)
    if (generatedName && generatedName.length > 0 && generatedName.length < 50) {
      return generatedName;
    }

    // Fallback to current keyword-based system
    return generateCanvasNameFallback(artifacts);

  } catch (error) {
    console.warn("LLM Canvas naming failed, using fallback:", error);
    return generateCanvasNameFallback(artifacts);
  }
}

// Enhanced fallback naming system (improved from current implementation)
function generateCanvasNameFallback(artifacts: CanvasArtifact[]): string {
  if (artifacts.length === 0) return "Canvas";

  const chartTitles = artifacts.map(a => a.title.toLowerCase());
  const keywords = chartTitles.join(" ");

  // Enhanced keyword analysis
  if (keywords.includes("sales") || keywords.includes("revenue") || keywords.includes("financial")) {
    return "Sales Analytics";
  } else if (keywords.includes("market") && (keywords.includes("global") || keywords.includes("share"))) {
    return "Market Intelligence";
  } else if (keywords.includes("population") || keywords.includes("demographic")) {
    return "Global Demographics";
  } else if (keywords.includes("performance") || keywords.includes("kpi")) {
    return "Performance Metrics";
  } else if (keywords.includes("user") || keywords.includes("traffic") || keywords.includes("engagement")) {
    return "User Analytics";
  } else if (keywords.includes("temperature") || keywords.includes("weather") || keywords.includes("climate")) {
    return "Climate Data";
  } else if (keywords.includes("stock") || keywords.includes("price") || keywords.includes("trading")) {
    return "Financial Markets";
  } else if (keywords.includes("production") || keywords.includes("manufacturing") || keywords.includes("output")) {
    return "Production Analytics";
  } else if (keywords.includes("emission") || keywords.includes("environmental") || keywords.includes("co2")) {
    return "Environmental Data";
  } else if (artifacts.length > 3) {
    return "Multi-Chart Dashboard";
  } else {
    return "Data Visualization";
  }
}

// Canvas type detection for custom canvas routing
export function detectCanvasType(artifacts: CanvasArtifact[]): string {
  if (artifacts.length === 0) return "general";

  const keywords = artifacts.map(a => a.title.toLowerCase()).join(" ");

  if (keywords.includes("sales") || keywords.includes("revenue")) {
    return "sales";
  } else if (keywords.includes("marketing") || keywords.includes("campaign")) {
    return "marketing";
  } else if (keywords.includes("financial") || keywords.includes("finance")) {
    return "finance";
  } else if (keywords.includes("analytics") || keywords.includes("performance")) {
    return "analytics";
  } else if (keywords.includes("operations") || keywords.includes("production")) {
    return "operations";
  } else {
    return "general";
  }
}