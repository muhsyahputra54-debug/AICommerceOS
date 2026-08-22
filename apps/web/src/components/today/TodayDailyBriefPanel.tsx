"use client";

import {
  useState,
} from "react";

import {
  Bot,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  TodayDailyBrief,
} from "@/lib/ai/today-contract";

import type {
  Dictionary,
} from "@/lib/i18n/dictionaries";

type TodayDailyBriefPanelProps = {
  initialBrief:
    TodayDailyBrief;

  copy:
    Dictionary["today"]["dailyBrief"];
};

type DailyBriefApiResponse = {
  dailyBrief?:
    TodayDailyBrief;

  error?:
    string;
};

export default function TodayDailyBriefPanel({
  initialBrief,
  copy,
}: TodayDailyBriefPanelProps) {
  const [
    brief,
    setBrief,
  ] =
    useState<TodayDailyBrief>(
      initialBrief,
    );

  const [
    isGenerating,
    setIsGenerating,
  ] =
    useState(false);

  const [
    requestError,
    setRequestError,
  ] =
    useState<string | null>(
      null,
    );

  async function handleGenerate() {
    if (isGenerating) {
      return;
    }

    setRequestError(
      null,
    );

    setIsGenerating(
      true,
    );

    try {
      const response =
        await fetch(
          "/api/ai/today/daily-brief",
          {
            method:
              "POST",
          },
        );

      const data =
        (await response
          .json()
          .catch(
            () => null,
          )) as
          | DailyBriefApiResponse
          | null;

      if (
        !response.ok ||
        !data?.dailyBrief
      ) {
        setRequestError(
          copy.requestFailed,
        );

        return;
      }

      setBrief(
        data.dailyBrief,
      );
    } catch {
      setRequestError(
        copy.requestFailed,
      );
    } finally {
      setIsGenerating(
        false,
      );
    }
  }

  const buttonLabel =
    isGenerating
      ? copy.generating
      : brief.status ===
          "ready"
        ? copy.regenerate
        : copy.generate;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <CardTitle>
                {copy.title}
              </CardTitle>

              <CardDescription className="mt-1">
                {copy.description}
              </CardDescription>
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
              brief.status ===
              "ready"
                ? "bg-primary/10 text-primary"
                : brief.status ===
                    "unavailable"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-secondary-foreground"
            }`}
          >
            {
              brief.status ===
              "ready"
                ? copy.ready
                : brief.status ===
                    "unavailable"
                  ? copy.unavailable
                  : copy.notGenerated
            }
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-5">
          {
            brief.status ===
            "ready"
              ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {
                          brief.headline
                        }
                      </h2>

                      <p className="mt-2 leading-6 text-muted-foreground">
                        {
                          brief.summary
                        }
                      </p>
                    </div>

                    {
                      brief.highlights
                        .length > 0
                        ? (
                            <ul className="space-y-2">
                              {
                                brief.highlights
                                  .map(
                                    (
                                      highlight,
                                      index,
                                    ) => (
                                      <li
                                        key={`${index}-${highlight}`}
                                        className="flex gap-3 text-sm"
                                      >
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                                        <span>
                                          {
                                            highlight
                                          }
                                        </span>
                                      </li>
                                    ),
                                  )
                              }
                            </ul>
                          )
                        : null
                    }
                  </div>
                )
              : brief.status ===
                  "unavailable"
                ? (
                    <p className="text-sm text-muted-foreground">
                      {
                        brief.reason
                      }
                    </p>
                  )
                : (
                    <p className="text-sm text-muted-foreground">
                      {
                        copy.notGeneratedDescription
                      }
                    </p>
                  )
          }

          {
            requestError
              ? (
                  <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {
                      requestError
                    }
                  </div>
                )
              : null
          }

          <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              {
                copy.creditsNotice
              }
            </p>

            <Button
              type="button"
              size="lg"
              disabled={
                isGenerating
              }
              onClick={
                handleGenerate
              }
            >
              {
                isGenerating
                  ? (
                      <LoaderCircle className="animate-spin" />
                    )
                  : (
                      <Sparkles />
                    )
              }

              {buttonLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}