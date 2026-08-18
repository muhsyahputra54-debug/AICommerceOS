"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default function LoginPage() {
  const { locale } = useLanguage();
  const dictionary = getDictionary(locale);

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
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold">
            LAKUVO
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {dictionary.login.subtitle}
          </p>
        </div>

        <div className="mt-8">
          <Button
            type="button"
            className="w-full"
            onClick={handleGitHubLogin}
          >
            {dictionary.login.continueWithGitHub}
          </Button>
        </div>
      </div>
    </main>
  );
}
