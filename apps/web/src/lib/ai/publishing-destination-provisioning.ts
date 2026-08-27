import {
  PUBLISHING_DESTINATION_CAPABILITIES,
  isPublishingDestinationCapability,
  isPublishingDestinationType,
  normalizePublishingProvider,
  type PublishingDestinationCapability,
  type PublishingDestinationType,
} from "./publishing-destination";

export const PUBLISHING_DESTINATION_PROVISIONING_RESOURCE =
  "server_verified_destination_metadata" as const;

export const PUBLISHING_DESTINATION_PROVISIONING_PROVIDER_CALLS_ENABLED =
  false as const;

export type PublishingDestinationProvisionInput = {
  provider: string;
  destinationType: PublishingDestinationType;
  externalDestinationId: string;
  displayName: string;
  capabilities: PublishingDestinationCapability[];
};

export type PublishingDestinationSelectionInput = {
  publishingDestinationId: string;
};

type ParseResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: string;
    };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROVISION_INPUT_KEYS = [
  "provider",
  "destinationType",
  "externalDestinationId",
  "displayName",
  "capabilities",
] as const;

const SELECTION_INPUT_KEYS = [
  "publishingDestinationId",
] as const;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys =
    Object.keys(value).sort();

  const normalizedExpected =
    [...expected].sort();

  return (
    keys.length ===
      normalizedExpected.length &&
    keys.every(
      (key, index) =>
        key ===
        normalizedExpected[index],
    )
  );
}

function normalizedNonBlankString(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  if (
    !normalized ||
    normalized.length > maxLength
  ) {
    return null;
  }

  return normalized;
}

function parseCapabilities(
  value: unknown,
): PublishingDestinationCapability[] | null {
  if (
    !Array.isArray(value) ||
    value.length >
      PUBLISHING_DESTINATION_CAPABILITIES.length
  ) {
    return null;
  }

  const parsed:
    PublishingDestinationCapability[] = [];

  for (const item of value) {
    if (
      !isPublishingDestinationCapability(item) ||
      parsed.includes(item)
    ) {
      return null;
    }

    parsed.push(item);
  }

  return parsed;
}

export function parsePublishingDestinationProvisionInput(
  value: unknown,
): ParseResult<PublishingDestinationProvisionInput> {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      PROVISION_INPUT_KEYS,
    )
  ) {
    return {
      ok: false,
      error:
        "Publishing destination provisioning input tidak valid.",
    };
  }

  const provider =
    normalizePublishingProvider(
      value.provider,
    );

  const externalDestinationId =
    normalizedNonBlankString(
      value.externalDestinationId,
      255,
    );

  const displayName =
    normalizedNonBlankString(
      value.displayName,
      200,
    );

  const capabilities =
    parseCapabilities(
      value.capabilities,
    );

  if (
    !provider ||
    !isPublishingDestinationType(
      value.destinationType,
    ) ||
    !externalDestinationId ||
    !displayName ||
    !capabilities
  ) {
    return {
      ok: false,
      error:
        "Publishing destination provisioning input tidak valid.",
    };
  }

  return {
    ok: true,
    value: {
      provider,
      destinationType:
        value.destinationType,
      externalDestinationId,
      displayName,
      capabilities,
    },
  };
}

export function parsePublishingDestinationSelectionInput(
  value: unknown,
): ParseResult<PublishingDestinationSelectionInput> {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      SELECTION_INPUT_KEYS,
    )
  ) {
    return {
      ok: false,
      error:
        "Publishing destination selection input tidak valid.",
    };
  }

  if (
    typeof value.publishingDestinationId !==
      "string" ||
    !UUID_PATTERN.test(
      value.publishingDestinationId,
    )
  ) {
    return {
      ok: false,
      error:
        "Publishing destination selection input tidak valid.",
    };
  }

  return {
    ok: true,
    value: {
      publishingDestinationId:
        value.publishingDestinationId.toLowerCase(),
    },
  };
}

export function publishingDestinationProvisioningCanCallProvider(): false {
  return PUBLISHING_DESTINATION_PROVISIONING_PROVIDER_CALLS_ENABLED;
}
