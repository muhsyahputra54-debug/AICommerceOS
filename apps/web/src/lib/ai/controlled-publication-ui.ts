import type {
  ControlledPublicationStatus,
} from "./controlled-publication";

import {
  normalizeControlledPublicationChannelContent,
} from "./controlled-publication-channel-target";

import type {
  PublishingDestinationType,
} from "./publishing-destination";

export type ControlledPublicationDestination = {
  id: string;
  provider: string;
  destinationType:
    PublishingDestinationType;
  name: string;
  externalDestinationId: string;
};

export function controlledPublicationCanConfirm(
  status: ControlledPublicationStatus,
) {
  return status ===
    "proposed";
}

export function controlledPublicationCanExecuteInSg4(
  _status: ControlledPublicationStatus,
) {
  void _status;

  return false as const;
}

export async function buildGrowthPublicationIdempotencyKey(
  destinationId: string,
  content: string,
): Promise<string | null> {
  const normalizedDestinationId =
    destinationId
      .trim()
      .toLowerCase();

  const normalizedContent =
    normalizeControlledPublicationChannelContent(
      content,
    );

  if (
    !normalizedDestinationId ||
    !normalizedContent
  ) {
    return null;
  }

  const material =
    `${normalizedDestinationId}\n${normalizedContent}`;

  const digest =
    await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(
        material,
      ),
    );

  const digestHex =
    Array.from(
      new Uint8Array(
        digest,
      ),
    )
      .map(
        (value) =>
          value
            .toString(16)
            .padStart(
              2,
              "0",
            ),
      )
      .join("");

  return `growth.${digestHex}`;
}
