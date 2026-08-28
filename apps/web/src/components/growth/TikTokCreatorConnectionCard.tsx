"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  parsePublishingProviderConnection,
  type PublishingProviderConnection,
} from "@/lib/ai/publishing-provider-connection";

import {
  projectTikTokCreatorConnectionUiState,
  type TikTokCreatorConnectionUiState,
} from "@/lib/ai/tiktok-creator-connection-ui";

import type {
  Locale,
} from "@/lib/i18n/config";

const CONNECTIONS_API =
  "/api/ai/publishing-provider-connections";

const TIKTOK_AUTHORIZE_URL =
  "/api/ai/publishing-provider-connections/tiktok/authorize";

type ViewState =
  | Readonly<{
      kind: "loading";
    }>
  | Readonly<{
      kind: "load_error";
    }>
  | TikTokCreatorConnectionUiState;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function parseConnectionResponse(
  value: unknown,
): PublishingProviderConnection[] | null {
  if (
    !isRecord(value) ||
    !Array.isArray(
      value.connections,
    )
  ) {
    return null;
  }

  const result:
    PublishingProviderConnection[] =
      [];

  for (
    const raw of
    value.connections
  ) {
    const parsed =
      parsePublishingProviderConnection(
        raw,
      );

    if (!parsed.ok) {
      return null;
    }

    result.push(
      parsed.value,
    );
  }

  return result;
}

function callbackCopy(
  status: string | null,
  isId: boolean,
): string | null {
  if (!status) {
    return null;
  }

  switch (status) {
    case "connected":
      return isId
        ? "Otorisasi TikTok selesai. LAKUVO sedang memeriksa koneksi yang tersimpan."
        : "TikTok authorization finished. LAKUVO is checking the persisted connection.";

    case "authorization_denied":
      return isId
        ? "Otorisasi TikTok dibatalkan atau ditolak."
        : "TikTok authorization was cancelled or denied.";

    case "scope_missing":
      return isId
        ? "TikTok tidak memberikan seluruh izin yang dibutuhkan. Hubungkan ulang dan setujui izin publikasi."
        : "TikTok did not grant every required permission. Reconnect and approve publishing permissions.";

    case "state_invalid":
      return isId
        ? "Sesi otorisasi TikTok tidak valid atau sudah kedaluwarsa. Mulai ulang koneksi."
        : "The TikTok authorization session is invalid or expired. Start the connection again.";

    default:
      return isId
        ? "Koneksi TikTok belum dapat diselesaikan. Anda dapat mencoba menghubungkan ulang."
        : "The TikTok connection could not be completed. You can try connecting again.";
  }
}

export default function TikTokCreatorConnectionCard({
  locale,
}: Readonly<{
  locale: Locale;
}>) {
  const isId =
    locale ===
    "id";

  const [
    view,
    setView,
  ] =
    useState<ViewState>({
      kind:
        "loading",
    });

  const [
    callbackMessage,
    setCallbackMessage,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(
    () => {
      let active =
        true;

      const currentUrl =
        new URL(
          window.location.href,
        );

      const nextCallbackMessage =
        currentUrl.searchParams.get(
          "publishingConnection",
        ) ===
        "tiktok"
          ? callbackCopy(
              currentUrl.searchParams.get(
                "status",
              ),
              isId,
            )
          : null;

      async function loadConnection() {
        try {
          const response =
            await fetch(
              CONNECTIONS_API,
              {
                method:
                  "GET",
                cache:
                  "no-store",
                credentials:
                  "same-origin",
                headers: {
                  Accept:
                    "application/json",
                },
              },
            );

          if (!response.ok) {
            throw new Error(
              "Connection request failed.",
            );
          }

          const body:
            unknown =
              await response.json();

          const connections =
            parseConnectionResponse(
              body,
            );

          if (!connections) {
            throw new Error(
              "Connection response invalid.",
            );
          }

          if (!active) {
            return;
          }

          setCallbackMessage(
            nextCallbackMessage,
          );

          setView(
            projectTikTokCreatorConnectionUiState(
              connections,
            ),
          );
        } catch {
          if (active) {
            setCallbackMessage(
              nextCallbackMessage,
            );

            setView({
              kind:
                "load_error",
            });
          }
        }
      }

      void loadConnection();

      return () => {
        active =
          false;
      };
    },
    [
      isId,
    ],
  );

  const copy =
    isId
      ? {
          eyebrow:
            "TIKTOK CREATOR",
          title:
            "TikTok Creator Publishing",
          description:
            "Hubungkan akun TikTok Anda untuk memberi LAKUVO izin publikasi yang Anda setujui. LAKUVO tidak mempublikasikan konten tanpa tindakan pengguna.",
          loading:
            "Memeriksa koneksi TikTok...",
          disconnected:
            "Belum terhubung",
          connected:
            "Terhubung",
          reconnectRequired:
            "Perlu otorisasi ulang",
          revoked:
            "Akses dicabut",
          scopeMissing:
            "Izin publikasi belum lengkap",
          ambiguous:
            "Status koneksi tidak dapat dipastikan",
          loadError:
            "Status koneksi belum dapat dimuat",
          account:
            "ID akun TikTok",
          permissions:
            "Izin aktif",
          connect:
            "Hubungkan TikTok",
          reconnect:
            "Hubungkan ulang TikTok",
          connectedHelp:
            "Koneksi tersimpan di server. Publikasi tetap memerlukan tindakan dan kontrol pengguna.",
          disconnectedHelp:
            "Login TikTok hanya dimulai setelah Anda menekan tombol Hubungkan TikTok.",
        }
      : {
          eyebrow:
            "TIKTOK CREATOR",
          title:
            "TikTok Creator Publishing",
          description:
            "Connect your TikTok account to grant LAKUVO the publishing permissions you approve. LAKUVO does not publish content without a user action.",
          loading:
            "Checking TikTok connection...",
          disconnected:
            "Not connected",
          connected:
            "Connected",
          reconnectRequired:
            "Reauthorization required",
          revoked:
            "Access revoked",
          scopeMissing:
            "Publishing permission is incomplete",
          ambiguous:
            "Connection status cannot be confirmed",
          loadError:
            "Connection status could not be loaded",
          account:
            "TikTok account ID",
          permissions:
            "Active permissions",
          connect:
            "Connect TikTok",
          reconnect:
            "Reconnect TikTok",
          connectedHelp:
            "The connection is stored server-side. Publishing still requires explicit user-controlled action.",
          disconnectedHelp:
            "TikTok Login starts only after you press Connect TikTok.",
        };

  const connected =
    view.kind ===
    "connected";

  const requiresReconnect =
    view.kind ===
      "reauthorization_required" ||
    view.kind ===
      "revoked" ||
    view.kind ===
      "scope_missing" ||
    view.kind ===
      "not_authorized";

  let statusLabel =
    copy.disconnected;

  if (
    view.kind ===
    "loading"
  ) {
    statusLabel =
      copy.loading;
  }
  else if (
    view.kind ===
    "load_error"
  ) {
    statusLabel =
      copy.loadError;
  }
  else if (connected) {
    statusLabel =
      copy.connected;
  }
  else if (
    view.kind ===
    "reauthorization_required"
  ) {
    statusLabel =
      copy.reconnectRequired;
  }
  else if (
    view.kind ===
    "revoked"
  ) {
    statusLabel =
      copy.revoked;
  }
  else if (
    view.kind ===
    "scope_missing"
  ) {
    statusLabel =
      copy.scopeMissing;
  }
  else if (
    view.kind ===
    "ambiguous"
  ) {
    statusLabel =
      copy.ambiguous;
  }

  const externalAccountId =
    "externalAccountId" in
    view
      ? view.externalAccountId
      : null;

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold tracking-[0.16em] text-primary">
            {copy.eyebrow}
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {copy.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {copy.description}
          </p>

          {callbackMessage ? (
            <div className="mt-4 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
              {callbackMessage}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={
                connected
                  ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  : "inline-flex rounded-full border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
              }
            >
              {statusLabel}
            </span>

            {externalAccountId ? (
              <span className="text-xs text-muted-foreground">
                {copy.account}:{" "}
                <span className="break-all font-medium text-foreground">
                  {externalAccountId}
                </span>
              </span>
            ) : null}
          </div>

          {connected ? (
            <>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                {copy.permissions}:{" "}
                {view.grantedScopes.join(
                  ", ",
                )}
              </p>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {copy.connectedHelp}
              </p>
            </>
          ) : (
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {copy.disconnectedHelp}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <a
            href={
              TIKTOK_AUTHORIZE_URL
            }
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {
              connected ||
              requiresReconnect
                ? copy.reconnect
                : copy.connect
            }
          </a>
        </div>
      </div>
    </section>
  );
}