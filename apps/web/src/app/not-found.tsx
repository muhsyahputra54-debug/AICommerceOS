import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          404 · AI Commerce OS
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The page you requested does not exist or is no
          longer available.
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Return to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
