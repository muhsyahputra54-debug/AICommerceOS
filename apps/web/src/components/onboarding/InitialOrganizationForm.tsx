"use client";
import { LakuvoBrand } from "@/components/brand/LakuvoBrand";

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
  MAX_INITIAL_ORGANIZATION_NAME_LENGTH,
  validateInitialOrganizationName,
} from "@/lib/organization/onboarding";

type OnboardingResponse = {
  organizationId?:
    string;

  code?:
    string;

  error?:
    string;
};

export function InitialOrganizationForm() {
  const router =
    useRouter();

  const {
    locale,
  } =
    useLanguage();

  const copy =
    locale ===
    "id"
      ? {
          title:
            "Siapkan workspace pertama Anda",

          subtitle:
            "Beri nama workspace bisnis Anda. Anda dapat mulai menggunakan TODAY setelah langkah ini.",

          label:
            "Nama bisnis / workspace",

          placeholder:
            "Contoh: LAKUVO Commerce",

          hint:
            `Maksimal ${MAX_INITIAL_ORGANIZATION_NAME_LENGTH} karakter.`,

          submit:
            "Lanjut ke TODAY",

          submitting:
            "Menyiapkan workspace...",

          required:
            "Nama workspace wajib diisi.",

          tooLong:
            `Nama workspace maksimal ${MAX_INITIAL_ORGANIZATION_NAME_LENGTH} karakter.`,

          failed:
            "Workspace belum dapat dibuat. Coba lagi.",
        }
      : {
          title:
            "Set up your first workspace",

          subtitle:
            "Name your business workspace. You can start using TODAY after this step.",

          label:
            "Business / workspace name",

          placeholder:
            "Example: LAKUVO Commerce",

          hint:
            `Maximum ${MAX_INITIAL_ORGANIZATION_NAME_LENGTH} characters.`,

          submit:
            "Continue to TODAY",

          submitting:
            "Setting up workspace...",

          required:
            "Workspace name is required.",

          tooLong:
            `Workspace name must be ${MAX_INITIAL_ORGANIZATION_NAME_LENGTH} characters or fewer.`,

          failed:
            "We could not create your workspace. Try again.",
        };

  const [
    name,
    setName,
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
      "name_required"
      | "name_too_long",
  ) {
    return error ===
      "name_required"
      ? copy.required
      : copy.tooLong;
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      pending
    ) {
      return;
    }

    setErrorMessage(
      null,
    );

    const validation =
      validateInitialOrganizationName(
        name,
      );

    if (
      !validation.ok
    ) {
      setErrorMessage(
        getValidationMessage(
          validation.error,
        ),
      );

      return;
    }

    setPending(
      true,
    );

    try {
      const response =
        await fetch(
          "/api/organizations/onboarding",
          {
            method:
              "POST",

            headers: {
              "content-type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  validation.name,
              }),
          },
        );

      const responseBody =
        await response
          .json()
          .catch(
            () =>
              null,
          ) as OnboardingResponse | null;

      if (
        !response.ok
      ) {
        if (
          responseBody?.code ===
          "ORGANIZATION_NAME_REQUIRED"
        ) {
          setErrorMessage(
            copy.required,
          );

          return;
        }

        if (
          responseBody?.code ===
          "ORGANIZATION_NAME_TOO_LONG"
        ) {
          setErrorMessage(
            copy.tooLong,
          );

          return;
        }

        setErrorMessage(
          copy.failed,
        );

        return;
      }

      if (
        typeof responseBody?.organizationId !==
        "string"
      ) {
        setErrorMessage(
          copy.failed,
        );

        return;
      }

      router.replace(
        "/today",
      );

      router.refresh();
    } catch {
      setErrorMessage(
        copy.failed,
      );
    } finally {
      setPending(
        false,
      );
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

          <h2 className="mt-5 text-xl font-semibold">
            {copy.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          noValidate
          className="mt-6 space-y-4"
        >
          <div className="space-y-2">
            <label
              htmlFor="organization-name"
              className="text-sm font-medium"
            >
              {copy.label}
            </label>

            <Input
              id="organization-name"
              name="organizationName"
              type="text"
              value={
                name
              }
              placeholder={
                copy.placeholder
              }
              onChange={
                (event) => {
                  setName(
                    event.target.value,
                  );

                  setErrorMessage(
                    null,
                  );
                }
              }
              disabled={
                pending
              }
              aria-invalid={
                Boolean(
                  errorMessage,
                )
              }
              autoFocus
            />

            <p className="text-xs text-muted-foreground">
              {copy.hint}
            </p>
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
            disabled={
              pending
            }
          >
            {
              pending
                ? copy.submitting
                : copy.submit
            }
          </Button>
        </form>
      </div>
    </main>
  );
}
