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
  MIN_AUTH_PASSWORD_LENGTH,
  normalizeAuthEmail,
  validateSignUpCredentials,
  type SignUpValidationError,
} from "@/lib/auth/auth-credentials";
import {
  DEFAULT_POST_AUTH_PATH,
} from "@/lib/auth/auth-routing";
import {
  createClient,
} from "@/lib/supabase/client";

export default function SignupPage() {
  const router =
    useRouter();

  const {
    locale,
  } =
    useLanguage();

  const copy =
    locale === "id"
      ? {
          title:
            "Buat akun LAKUVO",
          subtitle:
            "Mulai kelola operasi commerce Anda dalam satu workspace.",
          email: "Email",
          password: "Kata sandi",
          confirmPassword:
            "Konfirmasi kata sandi",
          passwordHint:
            `Minimal ${MIN_AUTH_PASSWORD_LENGTH} karakter.`,
          createAccount:
            "Buat akun",
          creating:
            "Membuat akun...",
          haveAccount:
            "Sudah punya akun?",
          signIn: "Masuk",
          emailRequired:
            "Email wajib diisi.",
          emailInvalid:
            "Masukkan alamat email yang valid.",
          passwordRequired:
            "Kata sandi wajib diisi.",
          passwordTooShort:
            `Gunakan minimal ${MIN_AUTH_PASSWORD_LENGTH} karakter.`,
          passwordMismatch:
            "Konfirmasi kata sandi tidak cocok.",
          signupFailed:
            "Akun belum dapat dibuat. Periksa data Anda lalu coba lagi.",
          checkEmailTitle:
            "Periksa email Anda",
          checkEmailDescription:
            "Kami telah mengirim tautan konfirmasi. Buka tautan tersebut untuk mengaktifkan akun LAKUVO.",
          backToLogin:
            "Kembali ke login",
        }
      : {
          title:
            "Create your LAKUVO account",
          subtitle:
            "Start managing your commerce operations in one workspace.",
          email: "Email",
          password: "Password",
          confirmPassword:
            "Confirm password",
          passwordHint:
            `At least ${MIN_AUTH_PASSWORD_LENGTH} characters.`,
          createAccount:
            "Create account",
          creating:
            "Creating account...",
          haveAccount:
            "Already have an account?",
          signIn: "Sign in",
          emailRequired:
            "Email is required.",
          emailInvalid:
            "Enter a valid email address.",
          passwordRequired:
            "Password is required.",
          passwordTooShort:
            `Use at least ${MIN_AUTH_PASSWORD_LENGTH} characters.`,
          passwordMismatch:
            "Passwords do not match.",
          signupFailed:
            "We could not create your account. Check your details and try again.",
          checkEmailTitle:
            "Check your email",
          checkEmailDescription:
            "We sent a confirmation link. Open it to activate your LAKUVO account.",
          backToLogin:
            "Back to login",
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
    confirmPassword,
    setConfirmPassword,
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

  const [
    checkEmail,
    setCheckEmail,
  ] =
    useState(false);

  function getValidationMessage(
    error:
      SignUpValidationError,
  ) {
    switch (error) {
      case "email_required":
        return copy.emailRequired;

      case "email_invalid":
        return copy.emailInvalid;

      case "password_required":
        return copy.passwordRequired;

      case "password_too_short":
        return copy.passwordTooShort;

      case "password_mismatch":
        return copy.passwordMismatch;
    }
  }

  async function handleSignup(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setErrorMessage(null);

    const validationError =
      validateSignUpCredentials({
        email,
        password,
        confirmPassword,
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

      const callbackUrl =
        new URL(
          "/auth/signup-callback",
          window.location.origin,
        );

      callbackUrl.searchParams.set(
        "redirectedFrom",
        DEFAULT_POST_AUTH_PATH,
      );

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email:
            normalizeAuthEmail(
              email,
            ),
          password,
          options: {
            emailRedirectTo:
              callbackUrl.toString(),
          },
        });

      if (error) {
        setErrorMessage(
          copy.signupFailed,
        );

        return;
      }

      if (data.session) {
        router.replace(
          DEFAULT_POST_AUTH_PATH,
        );

        router.refresh();

        return;
      }

      setPassword("");
      setConfirmPassword("");
      setCheckEmail(true);
    } finally {
      setPending(false);
    }
  }

  if (checkEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-lg shadow-primary/5">
          <div className="mb-4 flex justify-end">
            <LanguageSwitcher />
          </div>

          <h1 className="text-2xl font-bold">
            {
              copy.checkEmailTitle
            }
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {
              copy.checkEmailDescription
            }
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            {copy.backToLogin}
          </Link>
        </div>
      </main>
    );
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

          <h2 className="mt-5 text-xl font-semibold">
            {copy.title}
          </h2>

          <p className="mt-3 text-sm text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>

        <form
          onSubmit={handleSignup}
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
            <label
              htmlFor="password"
              className="text-sm font-medium"
            >
              {copy.password}
            </label>

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value,
                );
                setErrorMessage(null);
              }}
              disabled={pending}
            />

            <p className="text-xs text-muted-foreground">
              {copy.passwordHint}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium"
            >
              {
                copy.confirmPassword
              }
            </label>

            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={
                confirmPassword
              }
              onChange={(event) => {
                setConfirmPassword(
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
                ? copy.creating
                : copy.createAccount
            }
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {copy.haveAccount}{" "}

          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            {copy.signIn}
          </Link>
        </p>
      </div>
    </main>
  );
}