import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  description: string;
};

export default function StatsCard({
  title,
  value,
  icon,
  description,
}: StatsCardProps) {
  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              {title}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {value}
            </h2>

            <p className="mt-2 text-sm text-green-600">
              {description}
            </p>
          </div>

          <div className="rounded-xl bg-blue-100 p-3">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}