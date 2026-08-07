"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const revenueData = [
  { day: "Sen", revenue: 1200 },
  { day: "Sel", revenue: 1800 },
  { day: "Rab", revenue: 1500 },
  { day: "Kam", revenue: 2400 },
  { day: "Jum", revenue: 2100 },
  { day: "Sab", revenue: 2800 },
  { day: "Min", revenue: 3200 },
];

export default function RevenueChart() {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>

        <p className="text-sm text-muted-foreground">
          Pendapatan 7 hari terakhir
        </p>
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={revenueData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />

              <Tooltip
                formatter={(value) => [
                  `$${Number(value).toLocaleString("en-US")}`,
                  "Revenue",
                ]}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="currentColor"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}