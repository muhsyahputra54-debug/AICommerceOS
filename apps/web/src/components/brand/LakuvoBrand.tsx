import Image from "next/image";

type LakuvoBrandSize = "sm" | "md" | "lg";
type LakuvoBrandVariant = "full" | "mark";
type LakuvoBrandTone = "auto" | "inverse";

type LakuvoBrandProps = {
  showTagline?: boolean;
  className?: string;
  variant?: LakuvoBrandVariant;
  size?: LakuvoBrandSize;
  tone?: LakuvoBrandTone;
};

const markSizeClass: Record<LakuvoBrandSize, string> = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-16 w-16",
};

const wordmarkSizeClass: Record<LakuvoBrandSize, string> = {
  sm: "h-[24px] w-[122px]",
  md: "h-[31px] w-[158px]",
  lg: "h-[40px] w-[204px]",
};

const descriptorSizeClass: Record<LakuvoBrandSize, string> = {
  sm: "text-[6px] tracking-[0.30em]",
  md: "text-[7px] tracking-[0.34em]",
  lg: "text-[9px] tracking-[0.36em]",
};

function LakuvoMark({
  size,
}: {
  size: LakuvoBrandSize;
}) {
  return (
    <span
      className={`relative ${markSizeClass[size]} shrink-0`}
      aria-hidden="true"
    >
      <Image
        src="/brand/lakuvo-mark.png"
        alt=""
        fill
        sizes="64px"
        priority
        className="object-contain drop-shadow-[0_5px_7px_rgba(7,45,120,0.22)]"
      />
    </span>
  );
}

function LakuvoWordmark({
  size,
  tone,
}: {
  size: LakuvoBrandSize;
  tone: LakuvoBrandTone;
}) {
  return (
    <span
      className={`relative ${wordmarkSizeClass[size]} shrink-0`}
      aria-hidden="true"
    >
      <Image
        src="/brand/lakuvo-wordmark.png"
        alt=""
        fill
        sizes="220px"
        priority
        className={`object-contain object-left ${tone === "inverse" ? "brightness-0 invert" : "dark:brightness-0 dark:invert"}`}
      />
    </span>
  );
}

export function LakuvoBrand({
  showTagline = false,
  className = "",
  variant = "full",
  size = "md",
  tone = "auto",
}: LakuvoBrandProps) {
  if (variant === "mark") {
    return (
      <span
        className={`inline-flex items-center ${className}`}
        aria-label="LAKUVO"
      >
        <LakuvoMark size={size} />
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label="LAKUVO"
    >
      <LakuvoMark size={size} />

      <span className="flex min-w-0 flex-col justify-center">
        <LakuvoWordmark size={size} tone={tone} />

        {showTagline ? (
          <span
            className={`${descriptorSizeClass[size]} mt-0.5 whitespace-nowrap pl-[2px] font-medium uppercase leading-none text-muted-foreground`}
          >
            AI Commerce OS
          </span>
        ) : null}
      </span>
    </div>
  );
}