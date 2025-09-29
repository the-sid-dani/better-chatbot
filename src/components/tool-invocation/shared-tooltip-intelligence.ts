/**
 * Shared Tooltip Intelligence System
 *
 * Provides intelligent, context-aware labeling for chart tooltips to replace
 * hardcoded generic labels with meaningful, data-appropriate labels.
 *
 * Based on the successful geographic chart intelligent labeling pattern.
 */

export interface ChartTooltipContext {
  title: string;
  description?: string;
  unit?: string;
  chartType?: string;
  geoType?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export interface IntelligentTooltipLabels {
  valueLabel: string;
  categoryLabel: string;
  metricLabel: string;
  stageLabel: string;
  flowLabel: string;
  unitSuffix: string;
}

/**
 * Extract intelligent value label from chart context
 * Examples: "Sales by Region" → "Sales", "Population Growth" → "Population"
 */
export const extractValueLabel = (
  title: string,
  description?: string,
  unit?: string,
): string => {
  const text = `${title} ${description || ""}`.toLowerCase();

  // Data type patterns ordered from most specific to least specific
  // CRITICAL: Order matters! Specific patterns must come before generic ones
  const patterns = [
    {
      keywords: ["audience", "viewers", "users", "visits", "viewership"],
      label: "Audience",
    },
    {
      keywords: ["market", "share", "percentage", "percent"],
      label: "Market Share",
    },
    {
      keywords: ["growth", "increase", "rate", "change"],
      label: "Growth Rate",
    },
    { keywords: ["sales", "revenue", "income", "earnings"], label: "Sales" },
    {
      keywords: ["population", "people", "residents", "inhabitants"],
      label: "Population",
    },
    { keywords: ["budget", "spending", "cost", "expense"], label: "Budget" },
    {
      keywords: ["performance", "score", "rating", "index", "rank"],
      label: "Performance",
    },
    {
      keywords: ["conversion", "funnel", "conversion rate"],
      label: "Conversion",
    },
    { keywords: ["progress", "completion", "achievement"], label: "Progress" },
    { keywords: ["temperature", "weather", "climate"], label: "Temperature" },
    { keywords: ["gdp", "economic", "economy"], label: "GDP" },
    { keywords: ["traffic", "visits", "pageviews"], label: "Traffic" },
    {
      keywords: ["engagement", "interaction", "activity"],
      label: "Engagement",
    },
    // Generic patterns last (fallback only)
    { keywords: ["count", "number", "total", "quantity"], label: "Count" },
    { keywords: ["value", "amount", "sum"], label: "Value" },
  ];

  // Check for explicit unit-based labeling first
  if (unit) {
    const unitLabels: { [key: string]: string } = {
      $: "Revenue",
      USD: "Revenue",
      "%": "Percentage",
      people: "Population",
      users: "Users",
      views: "Views",
      clicks: "Clicks",
      conversions: "Conversions",
    };

    const unitKey = unit.toLowerCase().replace(/[^a-z]/g, "");
    if (unitLabels[unitKey]) {
      return unitLabels[unitKey];
    }
  }

  // Pattern matching with priority order
  for (const pattern of patterns) {
    if (pattern.keywords.some((keyword) => text.includes(keyword))) {
      return pattern.label;
    }
  }

  // Fallback: extract first meaningful word from title
  const titleWords = title
    .split(" ")
    .filter(
      (word) =>
        word.length > 2 &&
        !["by", "in", "of", "the", "and", "for", "with", "from", "to"].includes(
          word.toLowerCase(),
        ),
    );

  return titleWords.length > 0 ? titleWords[0] : "Value";
};

/**
 * Extract intelligent category/dimension label from chart context
 */
export const extractCategoryLabel = (
  title: string,
  description?: string,
  chartType?: string,
): string => {
  const text = `${title} ${description || ""}`.toLowerCase();

  // Context-specific category patterns
  const patterns = [
    { keywords: ["by region", "by state", "by country"], label: "Region" },
    { keywords: ["by product", "by item", "by category"], label: "Product" },
    { keywords: ["by stage", "by step", "by phase"], label: "Stage" },
    { keywords: ["by department", "by team", "by group"], label: "Department" },
    {
      keywords: ["by time", "by date", "by month", "by quarter"],
      label: "Time Period",
    },
    { keywords: ["by source", "by channel", "by medium"], label: "Source" },
    { keywords: ["by age", "by demographic"], label: "Demographics" },
    { keywords: ["by device", "by platform"], label: "Platform" },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some((keyword) => text.includes(keyword))) {
      return pattern.label;
    }
  }

  // Chart type specific defaults
  const chartTypeDefaults: { [key: string]: string } = {
    funnel: "Stage",
    sankey: "Node",
    treemap: "Category",
    radial: "Metric",
    gauge: "Measurement",
    calendar: "Date",
  };

  if (chartType && chartTypeDefaults[chartType]) {
    return chartTypeDefaults[chartType];
  }

  return "Category";
};

/**
 * Extract intelligent metric label for performance-based charts
 */
export const extractMetricLabel = (
  title: string,
  description?: string,
): string => {
  const text = `${title} ${description || ""}`.toLowerCase();

  const patterns = [
    { keywords: ["performance", "score", "rating"], label: "Performance" },
    { keywords: ["efficiency", "productivity"], label: "Efficiency" },
    { keywords: ["satisfaction", "rating", "feedback"], label: "Satisfaction" },
    { keywords: ["accuracy", "precision", "quality"], label: "Quality" },
    { keywords: ["speed", "time", "duration"], label: "Speed" },
    { keywords: ["completion", "progress", "achievement"], label: "Progress" },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some((keyword) => text.includes(keyword))) {
      return pattern.label;
    }
  }

  return "Metric";
};

/**
 * Extract intelligent stage/step label for process-based charts
 */
export const extractStageLabel = (
  title: string,
  description?: string,
): string => {
  const text = `${title} ${description || ""}`.toLowerCase();

  const patterns = [
    { keywords: ["funnel", "conversion"], label: "Funnel Stage" },
    { keywords: ["process", "workflow"], label: "Process Step" },
    { keywords: ["journey", "path"], label: "Journey Stage" },
    { keywords: ["pipeline", "sales"], label: "Pipeline Stage" },
    { keywords: ["phase", "milestone"], label: "Phase" },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some((keyword) => text.includes(keyword))) {
      return pattern.label;
    }
  }

  return "Stage";
};

/**
 * Extract intelligent flow label for network-based charts
 */
export const extractFlowLabel = (
  title: string,
  description?: string,
): string => {
  const text = `${title} ${description || ""}`.toLowerCase();

  const patterns = [
    { keywords: ["traffic", "visits", "users"], label: "Traffic Flow" },
    { keywords: ["money", "revenue", "budget"], label: "Financial Flow" },
    { keywords: ["data", "information", "content"], label: "Data Flow" },
    { keywords: ["energy", "power", "electricity"], label: "Energy Flow" },
    { keywords: ["process", "workflow", "operation"], label: "Process Flow" },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some((keyword) => text.includes(keyword))) {
      return pattern.label;
    }
  }

  return "Flow";
};

/**
 * Get appropriate region label based on geographic context
 */
export const getRegionLabel = (geoType?: string): string => {
  if (!geoType) return "Region";

  const labelMap: { [key: string]: string } = {
    world: "Country",
    "usa-states": "State",
    "usa-counties": "County",
    "usa-dma": "Market Area",
  };

  return labelMap[geoType] || "Region";
};

/**
 * Extract unit suffix for value formatting
 */
export const extractUnitSuffix = (
  unit?: string,
  title?: string,
  description?: string,
): string => {
  if (unit) return unit;

  const text = `${title || ""} ${description || ""}`.toLowerCase();

  // Common unit patterns
  if (
    text.includes("percentage") ||
    text.includes("percent") ||
    text.includes("%")
  ) {
    return "%";
  }
  if (
    text.includes("dollar") ||
    text.includes("revenue") ||
    text.includes("sales")
  ) {
    return "$";
  }
  if (
    text.includes("people") ||
    text.includes("population") ||
    text.includes("users")
  ) {
    return "";
  }

  return unit || "";
};

/**
 * Generate complete intelligent tooltip labels for any chart
 */
export const generateIntelligentTooltipLabels = (
  context: ChartTooltipContext,
): IntelligentTooltipLabels => {
  return {
    valueLabel: extractValueLabel(
      context.title,
      context.description,
      context.unit,
    ),
    categoryLabel: extractCategoryLabel(
      context.title,
      context.description,
      context.chartType,
    ),
    metricLabel: extractMetricLabel(context.title, context.description),
    stageLabel: extractStageLabel(context.title, context.description),
    flowLabel: extractFlowLabel(context.title, context.description),
    unitSuffix: extractUnitSuffix(
      context.unit,
      context.title,
      context.description,
    ),
  };
};

/**
 * Get intelligent label for a given data field
 */
export const getIntelligentLabel = (
  fieldKey: string,
  labels: Partial<IntelligentTooltipLabels>,
): string => {
  const labelMap: { [key: string]: keyof IntelligentTooltipLabels } = {
    value: "valueLabel",
    category: "categoryLabel",
    metric: "metricLabel",
    stage: "stageLabel",
    flow: "flowLabel",
    name: "categoryLabel",
    region: "categoryLabel",
  };

  const labelKey = labelMap[fieldKey.toLowerCase()];
  return labelKey && labels[labelKey]
    ? labels[labelKey]!
    : fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1);
};
