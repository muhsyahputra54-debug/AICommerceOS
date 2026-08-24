"use client";
import { LakuvoBrand } from "@/components/brand/LakuvoBrand";

import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";

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
} from "@/lib/auth/auth-credentials";
import {
  createClient,
} from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const {
    locale,
  } =
    useLanguage();

  const copy =
    locale === "id"
      ? {
          title:
            "Reset kata sandi",
          subtitle:
            "Masukkan email akun LAKUVO Anda. Kami akan mengirim tautan pemulihan jika akun tersebut tersedia.",
          email: "Email",
          submit:
            "Kirim tautan reset",
          submitting:
            "Mengirim...",
          emailRequired:
            "Email wajib diisi.",
          emailInvalid:
            "Masukkan alamat email yang valid.",
          failed:
            "Permintaan belum dapat diproses. Coba lagi.",
          sentTitle:
            "Periksa email Anda",
          sentDescription:
            "Jika akun tersedia, tautan reset kata sandi telah dikirim ke email tersebut.",
          backToLogin:
            "Kembali ke login",
        }
      : {
          title:
            "Reset your password",
          subtitle:
            "Enter your LAKUVO account email. We will send a recovery link if that account is available.",
          email: "Email",
          submit:
            "Send reset link",
          submitting:
            "Sending...",
          emailRequired:
            "Email is required.",
          emailInvalid:
            "Enter a valid email address.",
          failed:
            "We could not process the request. Try again.",
          sentTitle:
            "Check your email",
          sentDescription:
            "If the account is available, a password reset link has been sent to that email.",
          backToLogin:
            "Back to login",
        };

  const [
    email,
    setEmail,
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
    sent,
    setSent,
  ] =
    useState(false);

  async function handleSubmit(
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
        password: "recovery",
      });

    if (
      validationError ===
      "email_required"
    ) {
      setErrorMessage(
        copy.emailRequired,
      );

      return;
    }

    if (
      validationError ===
      "email_invalid"
    ) {
      setErrorMessage(
        copy.emailInvalid,
      );

      return;
    }

    setPending(true);

    try {
      const supabase =
        createClient();

      const redirectUrl =
        new URL(
          "/auth/recovery",
          window.location.origin,
        );

      const {
        error,
      } =
        await supabase.auth
          .resetPasswordForEmail(
            normalizeAuthEmail(
              email,
            ),
            {
              redirectTo:
                redirectUrl.toString(),
            },
          );

      if (error) {
        setErrorMessage(
          copy.failed,
        );

        return;
      }

      setSent(true);
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-lg shadow-primary/5">
          <div className="mb-4 flex justify-end">
            <LanguageSwitcher />
          </div>

          <h1 className="text-2xl font-bold">
            {copy.sentTitle}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {copy.sentDescription}
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

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
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
                ? copy.submitting
                : copy.submit
            }
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            {copy.backToLogin}
          </Link>
        </p>
      </div>
    </main>
  );
}