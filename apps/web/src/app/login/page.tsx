"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleGitHubLogin = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-lg shadow-primary/5">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            AI Commerce OS
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Masuk ke dashboard AI Commerce OS
          </p>
        </div>

        <div className="mt-8">
          <Button
            type="button"
            className="w-full"
            onClick={handleGitHubLogin}
          >
            Continue with GitHub
          </Button>
        </div>
      </div>
    </main>
  );
}