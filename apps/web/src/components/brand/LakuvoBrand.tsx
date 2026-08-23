import {
  Sparkles,
} from "lucide-react";

type LakuvoBrandProps = {
  showTagline?: boolean;
  className?: string;
};

export function LakuvoBrand({
  showTagline = false,
  className = "",
}: LakuvoBrandProps) {
  return (
    <div
      className={`flex items-center gap-3 ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
        <Sparkles className="h-5 w-5" />
      </span>

      <span className="min-w-0 leading-tight">
        <span className="block text-base font-extrabold tracking-tight">
          LAKUVO
        </span>

        {showTagline ? (
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            Business Intelligence
          </span>
        ) : null}
      </span>
    </div>
  );
}
