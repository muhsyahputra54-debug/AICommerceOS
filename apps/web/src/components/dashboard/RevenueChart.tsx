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

import type { Locale } from "@/lib/i18n/config";

export type SalesTrendPoint = {
  sale_date: string;
  units_sold: number | string;
  revenue: number | string;
  cost: number | string;
  profit: number | string;
  margin: number | string;
};

type RevenueChartProps = {
  data: SalesTrendPoint[];
  locale?: Locale;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  revenueLabel?: string;
  profitLabel?: string;
};

function toNumber(value: number | string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getIntlLocale(locale: Locale) {
  return locale === "id" ? "id-ID" : "en-US";
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDay(
  value: string,
  locale: Locale
) {
  return new Intl.DateTimeFormat(
    getIntlLocale(locale),
    {
      day: "2-digit",
      month: "short",
    }
  ).format(new Date(`${value}T00:00:00`));
}

export default function RevenueChart({
  data,
  locale = "id",
  title = "Revenue & Profit",
  description = "Completed sales",
  emptyTitle = "Belum ada completed sales",
  emptyDescription = "Trend akan muncul setelah order berhasil mencapai status completed.",
  revenueLabel = "Revenue",
  profitLabel = "Profit",
}: RevenueChartProps) {
  const intlLocale = getIntlLocale(locale);

  const chartData = data.map((point) => ({
    day: formatDay(point.sale_date, locale),
    revenue: toNumber(point.revenue),
    profit: toNumber(point.profit),
  }));

  const hasSales = chartData.some(
    (point) =>
      point.revenue !== 0 ||
      point.profit !== 0,
  );

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>

        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </CardHeader>

      <CardContent>
        {!hasSales ? (
          <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed">
            <div className="max-w-md px-6 text-center">
              <p className="font-medium">
                {emptyTitle}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {emptyDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
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
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(
                      intlLocale,
                      {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }
                    ).format(Number(value))
                  }
                />

                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    String(name),
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  name={revenueLabel}
                  stroke="currentColor"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />

                <Line
                  type="monotone"
                  dataKey="profit"
                  name={profitLabel}
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
