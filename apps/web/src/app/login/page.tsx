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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            AI Commerce OS
          </h1>

          <p className="mt-2 text-sm text-gray-500">
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