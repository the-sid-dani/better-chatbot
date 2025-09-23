"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";

import { JsonViewPopup } from "../json-view-popup";
import { generateUniqueKey } from "lib/utils";

// Dynamic import for react-simple-maps to avoid SSR issues
const ComposableMap = dynamic(
  () => import("react-simple-maps").then((mod) => mod.ComposableMap),
  { ssr: false }
);

const Geographies = dynamic(
  () => import("react-simple-maps").then((mod) => mod.Geographies),
  { ssr: false }
);

const Geography = dynamic(
  () => import("react-simple-maps").then((mod) => mod.Geography),
  { ssr: false }
);

// GeographicChart component props interface
export interface GeographicChartProps {
  // Chart title (required)
  title: string;
  // Chart data array (required)
  data: Array<{
    regionCode: string; // Region identifier
    regionName: string; // Region name
    value: number; // Numeric value
  }>;
  // Geography type (required)
  geoType: "world" | "usa-states" | "usa-dma" | "usa-counties";
  // Color scale (optional)
  colorScale?: "blues" | "reds" | "greens" | "viridis";
  // Chart description (optional)
  description?: string;
}

// Color scales for geographic data visualization
const colorScales = {
  blues: [
    "hsl(var(--muted))",
    "hsl(217, 91%, 95%)",
    "hsl(217, 91%, 85%)",
    "hsl(217, 91%, 75%)",
    "hsl(217, 91%, 60%)",
    "hsl(217, 91%, 45%)",
  ],
  reds: [
    "hsl(var(--muted))",
    "hsl(0, 91%, 95%)",
    "hsl(0, 91%, 85%)",
    "hsl(0, 91%, 75%)",
    "hsl(0, 91%, 60%)",
    "hsl(0, 91%, 45%)",
  ],
  greens: [
    "hsl(var(--muted))",
    "hsl(120, 91%, 95%)",
    "hsl(120, 91%, 85%)",
    "hsl(120, 91%, 75%)",
    "hsl(120, 91%, 60%)",
    "hsl(120, 91%, 45%)",
  ],
  viridis: [
    "hsl(var(--muted))",
    "hsl(290, 85%, 85%)",
    "hsl(250, 85%, 75%)",
    "hsl(200, 85%, 65%)",
    "hsl(150, 85%, 55%)",
    "hsl(80, 85%, 45%)",
  ],
};

// GeoJSON URLs for different geography types
const geoDataUrls = {
  world: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
  "usa-states": "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
  "usa-counties": "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json",
  "usa-dma": "https://gist.github.com/simzou/6459889/raw/nielsentopo.json",
};

export function GeographicChart(props: GeographicChartProps) {
  const { title, data, geoType, colorScale = "blues", description } = props;

  const [geoData, setGeoData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const deduplicateData = React.useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const names = acc.map((item) => item.regionName);
        const newRegionName = generateUniqueKey(item.regionName, names);
        return [
          ...acc,
          {
            ...item,
            regionName: newRegionName,
          },
        ];
      },
      [] as GeographicChartProps["data"],
    );
  }, [data]);

  // Create value-to-color mapping
  const valueToColor = React.useMemo(() => {
    const values = deduplicateData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const colors = colorScales[colorScale];

    return (value: number) => {
      if (minValue === maxValue) return colors[1];
      const normalized = (value - minValue) / (maxValue - minValue);
      const index = Math.min(Math.floor(normalized * (colors.length - 1)), colors.length - 2) + 1;
      return colors[index];
    };
  }, [deduplicateData, colorScale]);

  // Create region code to value mapping
  const regionValues = React.useMemo(() => {
    const mapping: { [key: string]: number } = {};
    deduplicateData.forEach(item => {
      mapping[item.regionCode] = item.value;
    });
    return mapping;
  }, [deduplicateData]);

  // Fetch geographic data
  React.useEffect(() => {
    const fetchGeoData = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = geoDataUrls[geoType];
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch geographic data: ${response.statusText}`);
        }

        const data = await response.json();
        setGeoData(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load geographic data";
        setError(message);
        console.error("Geographic chart error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeoData();
  }, [geoType]);

  // Generate chart configuration
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};

    deduplicateData.forEach((item, index) => {
      config[item.regionCode] = {
        label: item.regionName,
        color: valueToColor(item.value),
      };
    });

    return config;
  }, [deduplicateData, valueToColor]);

  const renderMap = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading geographic data...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-destructive text-sm text-center">
            <div>Failed to load geographic data</div>
            <div className="text-xs text-muted-foreground mt-1">{error}</div>
          </div>
        </div>
      );
    }

    if (!geoData) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-muted-foreground">No geographic data available</div>
        </div>
      );
    }

    return (
      <ComposableMap
        projection="geoAlbersUsa"
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoData}>
          {({ geographies }: any) =>
            geographies.map((geo: any) => {
              const regionCode = geo.id || geo.properties?.NAME || geo.properties?.name;
              const value = regionValues[regionCode];
              const fillColor = value !== undefined ? valueToColor(value) : "hsl(var(--muted))";

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      fill: "hsl(var(--accent))",
                      outline: "none",
                      cursor: "pointer"
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    );
  };

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader className="flex flex-col gap-1 relative pb-1 flex-shrink-0">
        <CardTitle className="flex items-center text-sm">
          Geographic Chart - {title}
          <div className="absolute right-4 top-0">
            <JsonViewPopup
              data={{
                ...props,
                data: deduplicateData,
              }}
            />
          </div>
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-2 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <div className="w-full h-full">
            {renderMap()}
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}