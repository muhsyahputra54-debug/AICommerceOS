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
    <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {title}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {value}
            </h2>

            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
              {description}
            </p>
          </div>

          <div className="rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-primary/10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}