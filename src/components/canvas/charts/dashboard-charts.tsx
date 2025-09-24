"use client";

import {
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Bar,
  Line,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartDataPoint } from "app-types/artifacts";

// Dashboard-optimized chart colors
const DASHBOARD_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
];

interface DashboardChartProps {
  data: ChartDataPoint[] | Array<{ label: string; value: number }>;
  title?: string;
  className?: string;
}

// Dashboard Bar Chart - optimized for card containers
export function DashboardBarChart({
  data,
  title: _title,
  className,
}: DashboardChartProps) {
  // title is used for accessibility and passed from parent Card component
  // Transform data for Recharts
  const chartData = (data as ChartDataPoint[]).map((item) => {
    const result: any = { name: item.xAxisLabel };
    item.series.forEach((series) => {
      result[series.seriesName] = series.value;
    });
    return result;
  });

  // Get all series names for bars
  const seriesNames =
    data.length > 0
      ? (data[0] as ChartDataPoint).series.map((s) => s.seriesName)
      : [];

  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={chartData}
          margin={{ top: 5, right: 15, left: 5, bottom: 25 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--muted-foreground))"
            opacity={0.2}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            interval="preserveStartEnd"
            height={25}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              fontSize: "11px",
              padding: "8px",
            }}
          />
          {seriesNames.map((seriesName, index) => (
            <Bar
              key={seriesName}
              dataKey={seriesName}
              fill={DASHBOARD_COLORS[index % DASHBOARD_COLORS.length]}
              radius={[2, 2, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Dashboard Line Chart - optimized for card containers
export function DashboardLineChart({
  data,
  title: _title,
  className,
}: DashboardChartProps) {
  // title is used for accessibility and passed from parent Card component
  // Transform data for Recharts
  const chartData = (data as ChartDataPoint[]).map((item) => {
    const result: any = { name: item.xAxisLabel };
    item.series.forEach((series) => {
      result[series.seriesName] = series.value;
    });
    return result;
  });

  // Get all series names for lines
  const seriesNames =
    data.length > 0
      ? (data[0] as ChartDataPoint).series.map((s) => s.seriesName)
      : [];

  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={chartData}
          margin={{ top: 5, right: 15, left: 5, bottom: 25 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--muted-foreground))"
            opacity={0.2}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            interval="preserveStartEnd"
            height={25}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              fontSize: "11px",
              padding: "8px",
            }}
          />
          {seriesNames.map((seriesName, index) => (
            <Line
              key={seriesName}
              type="monotone"
              dataKey={seriesName}
              stroke={DASHBOARD_COLORS[index % DASHBOARD_COLORS.length]}
              strokeWidth={2}
              dot={{
                r: 2,
                fill: DASHBOARD_COLORS[index % DASHBOARD_COLORS.length],
              }}
              activeDot={{ r: 3 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Dashboard Pie Chart - optimized for card containers
export function DashboardPieChart({
  data,
  title: _title,
  className,
}: DashboardChartProps) {
  // title is used for accessibility and passed from parent Card component
  // Transform data for pie chart
  const pieData =
    Array.isArray(data) && data.length > 0 && "label" in data[0]
      ? (data as Array<{ label: string; value: number }>)
      : (data as ChartDataPoint[]).map((point) => ({
          name: point.xAxisLabel,
          value: point.series[0]?.value || 0,
        }));

  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
          <Pie
            data={pieData}
            cx="50%"
            cy="45%"
            innerRadius={30}
            outerRadius={60}
            paddingAngle={1}
            dataKey="value"
          >
            {pieData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={DASHBOARD_COLORS[index % DASHBOARD_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              fontSize: "11px",
              padding: "6px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "9px" }}
            iconSize={6}
            verticalAlign="bottom"
            height={15}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
