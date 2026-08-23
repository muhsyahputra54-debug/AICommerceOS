"use client";

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
  validateNewPassword,
  type NewPasswordValidationError,
} from "@/lib/auth/auth-credentials";
import {
  createClient,
} from "@/lib/supabase/client";

export default function ResetPasswordPage() {
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
            "Buat kata sandi baru",
          subtitle:
            "Gunakan kata sandi baru untuk akun LAKUVO Anda.",
          password:
            "Kata sandi baru",
          confirmPassword:
            "Konfirmasi kata sandi",
          hint:
            `Minimal ${MIN_AUTH_PASSWORD_LENGTH} karakter.`,
          submit:
            "Simpan kata sandi",
          submitting:
            "Menyimpan...",
          passwordRequired:
            "Kata sandi wajib diisi.",
          passwordTooShort:
            `Gunakan minimal ${MIN_AUTH_PASSWORD_LENGTH} karakter.`,
          passwordMismatch:
            "Konfirmasi kata sandi tidak cocok.",
          failed:
            "Kata sandi belum dapat diperbarui. Buka kembali tautan reset atau minta tautan baru.",
          success:
            "Kata sandi berhasil diperbarui.",
          signIn:
            "Masuk dengan kata sandi baru",
        }
      : {
          title:
            "Create a new password",
          subtitle:
            "Use a new password for your LAKUVO account.",
          password:
            "New password",
          confirmPassword:
            "Confirm password",
          hint:
            `At least ${MIN_AUTH_PASSWORD_LENGTH} characters.`,
          submit:
            "Save password",
          submitting:
            "Saving...",
          passwordRequired:
            "Password is required.",
          passwordTooShort:
            `Use at least ${MIN_AUTH_PASSWORD_LENGTH} characters.`,
          passwordMismatch:
            "Passwords do not match.",
          failed:
            "We could not update the password. Reopen the reset link or request a new one.",
          success:
            "Your password has been updated.",
          signIn:
            "Sign in with new password",
        };

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
    errorKind,
    setErrorKind,
  ] =
    useState<
      NewPasswordValidationError |
      "update_failed" |
      null
    >(
      null,
    );

  const [
    pending,
    setPending,
  ] =
    useState(false);

  const [
    completed,
    setCompleted,
  ] =
    useState(false);

  function getErrorMessage(
    error:
      NewPasswordValidationError |
      "update_failed",
  ) {
    switch (error) {
      case "password_required":
        return copy.passwordRequired;

      case "password_too_short":
        return copy.passwordTooShort;

      case "password_mismatch":
        return copy.passwordMismatch;

      case "update_failed":
        return copy.failed;
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setErrorKind(null);

    const validationError =
      validateNewPassword({
        password,
        confirmPassword,
      });

    if (validationError) {
      setErrorKind(
        validationError,
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
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        setErrorKind(
          "update_failed",
        );

        return;
      }

      setPassword("");
      setConfirmPassword("");
      setCompleted(true);
    } finally {
      setPending(false);
    }
  }

  async function handleReturnToLogin() {
    const supabase =
      createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  if (completed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-lg shadow-primary/5">
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher />
          </div>

          <h1 className="text-2xl font-bold">
            {copy.success}
          </h1>

          <Button
            type="button"
            className="mt-8 w-full"
            onClick={
              handleReturnToLogin
            }
          >
            {copy.signIn}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-lg shadow-primary/5">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold">
            LAKUVO
          </h1>

          <h2 className="mt-5 text-xl font-semibold">
            {copy.title}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 space-y-4"
        >
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
                setErrorKind(null);
              }}
              disabled={pending}
            />

            <p className="text-xs text-muted-foreground">
              {copy.hint}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium"
            >
              {copy.confirmPassword}
            </label>

            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(
                  event.target.value,
                );
                setErrorKind(null);
              }}
              disabled={pending}
            />
          </div>

          {
            errorKind
              ? (
                  <p
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {
                      getErrorMessage(
                        errorKind,
                      )
                    }
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

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            {
              locale === "id"
                ? "Minta tautan baru"
                : "Request a new link"
            }
          </Link>
        </p>
      </div>
    </main>
  );
}