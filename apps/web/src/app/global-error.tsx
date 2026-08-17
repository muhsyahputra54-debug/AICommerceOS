"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "Fatal AICommerceOS application error.",
        error,
      );
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#ffffff",
          color: "#171717",
          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          <section
            role="alert"
            style={{
              width: "100%",
              maxWidth: "520px",
              border: "1px solid #e5e5e5",
              borderRadius: "16px",
              padding: "32px",
              boxSizing: "border-box",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#737373",
                fontSize: "14px",
              }}
            >
              AI Commerce OS
            </p>

            <h1
              style={{
                margin: "12px 0 0",
                fontSize: "24px",
              }}
            >
              Application unavailable
            </h1>

            <p
              style={{
                margin: "12px 0 0",
                color: "#525252",
                lineHeight: 1.6,
                fontSize: "14px",
              }}
            >
              A critical application error occurred.
              Please retry the application.
            </p>

            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "24px",
                border: 0,
                borderRadius: "8px",
                padding: "10px 16px",
                background: "#171717",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
