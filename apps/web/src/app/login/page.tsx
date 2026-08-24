"use client";
import { LakuvoBrand } from "@/components/brand/LakuvoBrand";

import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  LanguageSwitcher,
} from "@/components/i18n/LanguageSwitcher";
import {
  useLanguage,
} from "@/components/i18n/LanguageProvider";
import {
  Button,
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";

import {
  normalizeAuthEmail,
  validateSignInCredentials,
  type SignInValidationError,
} from "@/lib/auth/auth-credentials";
import {
  resolveSafePostAuthPath,
} from "@/lib/auth/auth-routing";
import {
  getDictionary,
} from "@/lib/i18n/dictionaries";
import {
  createClient,
} from "@/lib/supabase/client";

export default function LoginPage() {
  const router =
    useRouter();

  const {
    locale,
  } =
    useLanguage();

  const dictionary =
    getDictionary(locale);

  const copy =
    locale === "id"
      ? {
          email: "Email",
          password: "Kata sandi",
          signIn: "Masuk",
          signingIn: "Memproses...",
          forgotPassword:
            "Lupa kata sandi?",
          noAccount:
            "Belum punya akun?",
          createAccount:
            "Buat akun",
          divider: "atau",
          invalidCredentials:
            "Email atau kata sandi tidak valid.",
          emailRequired:
            "Email wajib diisi.",
          emailInvalid:
            "Masukkan alamat email yang valid.",
          passwordRequired:
            "Kata sandi wajib diisi.",
          githubFailed:
            "Tidak dapat memulai login GitHub.",
        }
      : {
          email: "Email",
          password: "Password",
          signIn: "Sign in",
          signingIn: "Signing in...",
          forgotPassword:
            "Forgot password?",
          noAccount:
            "Don't have an account?",
          createAccount:
            "Create account",
          divider: "or",
          invalidCredentials:
            "Invalid email or password.",
          emailRequired:
            "Email is required.",
          emailInvalid:
            "Enter a valid email address.",
          passwordRequired:
            "Password is required.",
          githubFailed:
            "Unable to start GitHub sign-in.",
        };

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    pending,
    setPending,
  ] =
    useState(false);

  function getValidationMessage(
    error:
      SignInValidationError,
  ) {
    switch (error) {
      case "email_required":
        return copy.emailRequired;

      case "email_invalid":
        return copy.emailInvalid;

      case "password_required":
        return copy.passwordRequired;
    }
  }

  function getDestination() {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    return resolveSafePostAuthPath(
      params.get(
        "redirectedFrom",
      ),
    );
  }

  async function handleEmailLogin(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setErrorMessage(null);

    const validationError =
      validateSignInCredentials({
        email,
        password,
      });

    if (validationError) {
      setErrorMessage(
        getValidationMessage(
          validationError,
        ),
      );

      return;
    }

    setPending(true);

    try {
      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              normalizeAuthEmail(
                email,
              ),
            password,
          });

      if (error) {
        setErrorMessage(
          copy.invalidCredentials,
        );

        return;
      }

      router.replace(
        getDestination(),
      );

      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleGitHubLogin() {
    if (pending) {
      return;
    }

    setPending(true);
    setErrorMessage(null);

    try {
      const supabase =
        createClient();

      const callbackUrl =
        new URL(
          "/auth/callback",
          window.location.origin,
        );

      callbackUrl.searchParams.set(
        "redirectedFrom",
        getDestination(),
      );

      const {
        error,
      } =
        await supabase.auth
          .signInWithOAuth({
            provider: "github",
            options: {
              redirectTo:
                callbackUrl.toString(),
            },
          });

      if (error) {
        setErrorMessage(
          copy.githubFailed,
        );
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-lg shadow-primary/5 sm:p-7">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="text-center">
          <div className="flex justify-center">
            <LakuvoBrand size="md" />
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {
              dictionary.login
                .subtitle
            }
          </p>
        </div>

        <form
          onSubmit={
            handleEmailLogin
          }
          noValidate
          className="mt-6 space-y-4"
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium"
            >
              {copy.email}
            </label>

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(
                  event.target.value,
                );
                setErrorMessage(null);
              }}
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="password"
                className="text-sm font-medium"
              >
                {copy.password}
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                {
                  copy.forgotPassword
                }
              </Link>
            </div>

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value,
                );
                setErrorMessage(null);
              }}
              disabled={pending}
            />
          </div>

          {
            errorMessage
              ? (
                  <p
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errorMessage}
                  </p>
                )
              : null
          }

          <Button
            type="submit"
            className="w-full"
            disabled={pending}
          >
            {
              pending
                ? copy.signingIn
                : copy.signIn
            }
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />

          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {copy.divider}
          </span>

          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={
            handleGitHubLogin
          }
        >
          {
            dictionary.login
              .continueWithGitHub
          }
        </Button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {copy.noAccount}{" "}

          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            {copy.createAccount}
          </Link>
        </p>
      </div>
    </main>
  );
}