"use client";

import * as React from "react";
import {
  ResponsiveContainer,
} from "recharts";

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

// SankeyChart component props interface
export interface SankeyChartProps {
  // Chart title (required)
  title: string;
  // Nodes data (required)
  nodes: Array<{
    id: string; // Node ID
    name: string; // Node display name
  }>;
  // Links data (required)
  links: Array<{
    source: string; // Source node ID
    target: string; // Target node ID
    value: number; // Flow value
  }>;
  // Chart description (optional)
  description?: string;
}

// Color scheme for sankey nodes and links
const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function SankeyChart(props: SankeyChartProps) {
  const { title, nodes, links, description } = props;

  const deduplicateData = React.useMemo(() => {
    // Deduplicate nodes
    const nodeNames = new Map<string, string>();
    const deduplicatedNodes = nodes.reduce((acc, node) => {
      const existingNames = acc.map(n => n.name);
      const newName = generateUniqueKey(node.name, existingNames);
      nodeNames.set(node.id, newName);
      return [...acc, { ...node, name: newName }];
    }, [] as SankeyChartProps["nodes"]);

    // Update links with deduplicated node references
    const deduplicatedLinks = links.map(link => ({
      ...link,
      sourceName: nodeNames.get(link.source) || link.source,
      targetName: nodeNames.get(link.target) || link.target,
    }));

    return { nodes: deduplicatedNodes, links: deduplicatedLinks };
  }, [nodes, links]);

  // Generate chart configuration
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};

    deduplicateData.nodes.forEach((node, index) => {
      config[node.id] = {
        label: node.name,
        color: chartColors[index % chartColors.length],
      };
    });

    return config;
  }, [deduplicateData.nodes]);

  // Calculate layout for simplified sankey visualization
  const layout = React.useMemo(() => {
    const { nodes: nodeData, links: linkData } = deduplicateData;

    // Simple layout algorithm - arrange nodes in columns based on connections
    const nodePositions = new Map();
    const nodeColumns = new Map();

    // Find source nodes (nodes with no incoming links)
    const sourceNodes = nodeData.filter(node =>
      !linkData.some(link => link.target === node.id)
    );

    // Find sink nodes (nodes with no outgoing links)
    const sinkNodes = nodeData.filter(node =>
      !linkData.some(link => link.source === node.id)
    );

    // Assign columns
    sourceNodes.forEach(node => nodeColumns.set(node.id, 0));
    sinkNodes.forEach(node => nodeColumns.set(node.id, 2));

    // Middle nodes get column 1
    nodeData.forEach(node => {
      if (!nodeColumns.has(node.id)) {
        nodeColumns.set(node.id, 1);
      }
    });

    // Calculate positions
    const columnWidth = 300;
    const nodeHeight = 40;
    const nodeSpacing = 60;

    const columnCounts = [0, 0, 0];
    nodeData.forEach(node => {
      const col = nodeColumns.get(node.id);
      const row = columnCounts[col];
      nodePositions.set(node.id, {
        x: col * columnWidth + 50,
        y: row * nodeSpacing + 50,
        width: 150,
        height: nodeHeight,
        column: col
      });
      columnCounts[col]++;
    });

    return { nodePositions, linkData };
  }, [deduplicateData]);

  // Custom SVG-based sankey visualization
  const SankeyVisualization = React.useCallback(() => {
    const { nodePositions } = layout;
    const maxX = Math.max(...Array.from(nodePositions.values()).map(p => p.x + p.width));
    const maxY = Math.max(...Array.from(nodePositions.values()).map(p => p.y + p.height));

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${maxX + 100} ${maxY + 100}`}>
        {/* Render links */}
        {deduplicateData.links.map((link, index) => {
          const sourcePos = nodePositions.get(link.source);
          const targetPos = nodePositions.get(link.target);

          if (!sourcePos || !targetPos) return null;

          const sourceX = sourcePos.x + sourcePos.width;
          const sourceY = sourcePos.y + sourcePos.height / 2;
          const targetX = targetPos.x;
          const targetY = targetPos.y + targetPos.height / 2;

          const controlX1 = sourceX + (targetX - sourceX) * 0.6;
          const controlX2 = targetX - (targetX - sourceX) * 0.6;

          const pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY} ${controlX2} ${targetY} ${targetX} ${targetY}`;

          return (
            <g key={`link-${index}`}>
              <path
                d={pathData}
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={Math.max(2, link.value / 10)}
                fill="none"
                opacity={0.6}
              />
              {/* Link label */}
              <text
                x={(sourceX + targetX) / 2}
                y={(sourceY + targetY) / 2 - 10}
                textAnchor="middle"
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
              >
                {link.value.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Render nodes */}
        {deduplicateData.nodes.map((node, index) => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;

          return (
            <g key={node.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.width}
                height={pos.height}
                fill={chartColors[index % chartColors.length]}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                rx="4"
                opacity={0.8}
              />
              <text
                x={pos.x + pos.width / 2}
                y={pos.y + pos.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="hsl(var(--background))"
                fontWeight="bold"
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }, [layout, deduplicateData]);

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader className="flex flex-col gap-1 relative pb-1 flex-shrink-0">
        <CardTitle className="flex items-center text-sm">
          Sankey Chart - {title}
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
          <ResponsiveContainer width="100%" height="100%">
            <div className="w-full h-full flex items-center justify-center">
              <SankeyVisualization />
            </div>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}