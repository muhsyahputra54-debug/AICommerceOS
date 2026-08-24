"use client";
import { LakuvoBrand } from "@/components/brand/LakuvoBrand";

import {
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

export type OrganizationSelectorOption = {
  organizationId: string;
  name: string;
  role: string;
};

type OrganizationSelectorProps = {
  organizations:
    OrganizationSelectorOption[];
};

export function OrganizationSelector({
  organizations,
}: OrganizationSelectorProps) {
  const router =
    useRouter();

  const {
    locale,
  } =
    useLanguage();

  const [
    pendingOrganizationId,
    setPendingOrganizationId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  const copy =
    locale === "id"
      ? {
          title:
            "Pilih workspace",
          subtitle:
            "Akun Anda terhubung ke beberapa workspace. Pilih workspace yang ingin digunakan sekarang.",
          selecting:
            "Memilih...",
          select:
            "Gunakan workspace ini",
          failed:
            "Workspace belum dapat dipilih. Coba lagi.",
          role:
            "Peran",
        }
      : {
          title:
            "Choose a workspace",
          subtitle:
            "Your account belongs to multiple workspaces. Choose the workspace you want to use now.",
          selecting:
            "Selecting...",
          select:
            "Use this workspace",
          failed:
            "We could not select this workspace. Try again.",
          role:
            "Role",
        };

  async function selectOrganization(
    organizationId:
      string,
  ) {
    if (pendingOrganizationId) {
      return;
    }

    setErrorMessage(
      null,
    );

    setPendingOrganizationId(
      organizationId,
    );

    try {
      const response =
        await fetch(
          "/api/organizations/active",
          {
            method:
              "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify({
                organizationId,
              }),
          },
        );

      if (!response.ok) {
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
      setPendingOrganizationId(
        null,
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="w-full max-w-xl rounded-2xl border border-border/70 bg-card p-6 shadow-lg shadow-primary/5 sm:p-7">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="text-center">
          <div className="flex justify-center">
            <LakuvoBrand size="md" />
          </div>

          <h2 className="mt-4 text-xl font-semibold">
            {copy.title}
          </h2>

          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {organizations.map(
            (organization) => {
              const pending =
                pendingOrganizationId ===
                organization.organizationId;

              return (
                <div
                  key={
                    organization.organizationId
                  }
                  className="rounded-xl border border-border/70 p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {organization.name}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {copy.role}:{" "}
                      {organization.role}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      pendingOrganizationId !==
                      null
                    }
                    onClick={
                      () =>
                        void selectOrganization(
                          organization.organizationId,
                        )
                    }
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {
                      pending
                        ? copy.selecting
                        : copy.select
                    }
                  </button>
                </div>
              );
            },
          )}
        </div>

        {
          errorMessage
            ? (
                <p
                  role="alert"
                  className="mt-4 text-sm text-destructive"
                >
                  {errorMessage}
                </p>
              )
            : null
        }
      </div>
    </main>
  );
}
