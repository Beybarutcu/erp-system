import * as React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export interface AreaChartProps {
  data: any[];
  areas: {
    dataKey: string;
    name?: string;
    color?: string;
  }[];
  xAxisKey: string;
  height?: number;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  curve?: "linear" | "monotone" | "natural" | "step";
}

export function AreaChart({
  data,
  areas,
  xAxisKey,
  height = 300,
  className,
  showGrid = true,
  showLegend = true,
  stacked = false,
  curve = "monotone",
}: AreaChartProps) {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: "#e5e7eb" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          />
          {showLegend && <Legend />}
          {areas.map((area, index) => (
            <Area
              key={area.dataKey}
              type={curve}
              dataKey={area.dataKey}
              name={area.name || area.dataKey}
              stroke={area.color || colors[index % colors.length]}
              fill={area.color || colors[index % colors.length]}
              fillOpacity={0.6}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
