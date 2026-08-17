"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "Unhandled AICommerceOS application error.",
        error,
      );
    }
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section
        role="alert"
        className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm"
      >
        <p className="text-sm font-medium text-muted-foreground">
          AI Commerce OS
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The application could not complete this request.
          You can retry the operation or return to the
          dashboard.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>

          <Link
            href="/"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Return to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
