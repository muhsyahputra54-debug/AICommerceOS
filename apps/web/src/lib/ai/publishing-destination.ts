export const PUBLISHING_DESTINATION_RESOURCE =
  "publishing_channel_destination" as const;

export const PUBLISHING_DESTINATION_TYPES = [
  "account",
  "page",
  "channel",
] as const;

export type PublishingDestinationType =
  (typeof PUBLISHING_DESTINATION_TYPES)[number];

export const PUBLISHING_DESTINATION_STATUSES = [
  "active",
  "revoked",
] as const;

export type PublishingDestinationStatus =
  (typeof PUBLISHING_DESTINATION_STATUSES)[number];

export const PUBLISHING_DESTINATION_CAPABILITIES = [
  "publish_text",
  "publish_image",
  "publish_video",
] as const;

export type PublishingDestinationCapability =
  (typeof PUBLISHING_DESTINATION_CAPABILITIES)[number];

/*
 * SG5-B1 establishes destination identity only.
 *
 * It does not add OAuth, credentials, a provider adapter,
 * a controlled-publication execute route, or external execution.
 */
export const PUBLISHING_EXTERNAL_EXECUTION_ENABLED =
  false as const;

export type PublishingDestinationRecord = {
  id: string;
  organizationId: string;
  provider: string;
  destinationType: PublishingDestinationType;
  externalDestinationId: string;
  displayName: string;
  status: PublishingDestinationStatus;
  capabilities: PublishingDestinationCapability[];
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
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

const PROVIDER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,99}$/;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function requiredUuid(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" ||
    !UUID_PATTERN.test(value)
  ) {
    return null;
  }

  return value.toLowerCase();
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

export function normalizePublishingProvider(
  value: unknown,
): string | null {
  const normalized =
    normalizedNonBlankString(
      value,
      100,
    )?.toLowerCase() ?? null;

  if (
    !normalized ||
    !PROVIDER_PATTERN.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

export function isPublishingDestinationType(
  value: unknown,
): value is PublishingDestinationType {
  return (
    typeof value === "string" &&
    (
      PUBLISHING_DESTINATION_TYPES as readonly string[]
    ).includes(value)
  );
}

export function isPublishingDestinationStatus(
  value: unknown,
): value is PublishingDestinationStatus {
  return (
    typeof value === "string" &&
    (
      PUBLISHING_DESTINATION_STATUSES as readonly string[]
    ).includes(value)
  );
}

export function isPublishingDestinationCapability(
  value: unknown,
): value is PublishingDestinationCapability {
  return (
    typeof value === "string" &&
    (
      PUBLISHING_DESTINATION_CAPABILITIES as readonly string[]
    ).includes(value)
  );
}

function parseCapabilities(
  value: unknown,
): PublishingDestinationCapability[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const capabilities:
    PublishingDestinationCapability[] = [];

  for (const item of value) {
    if (
      !isPublishingDestinationCapability(item) ||
      capabilities.includes(item)
    ) {
      return null;
    }

    capabilities.push(item);
  }

  return capabilities;
}

function validTimestamp(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed =
    Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return value;
}

export function parsePublishingDestinationRecord(
  value: unknown,
): ParseResult<PublishingDestinationRecord> {
  if (!isRecord(value)) {
    return {
      ok: false,
      error:
        "Publishing destination record tidak valid.",
    };
  }

  const id =
    requiredUuid(value.id);

  const organizationId =
    requiredUuid(
      value.organization_id,
    );

  const provider =
    normalizePublishingProvider(
      value.provider,
    );

  const externalDestinationId =
    normalizedNonBlankString(
      value.external_destination_id,
      255,
    );

  const displayName =
    normalizedNonBlankString(
      value.display_name,
      200,
    );

  const capabilities =
    parseCapabilities(
      value.capabilities,
    );

  const createdAt =
    validTimestamp(
      value.created_at,
    );

  const updatedAt =
    validTimestamp(
      value.updated_at,
    );

  if (
    !id ||
    !organizationId ||
    !provider ||
    !isPublishingDestinationType(
      value.destination_type,
    ) ||
    !externalDestinationId ||
    !displayName ||
    !isPublishingDestinationStatus(
      value.status,
    ) ||
    !capabilities ||
    typeof value.is_selected !==
      "boolean" ||
    !createdAt ||
    !updatedAt
  ) {
    return {
      ok: false,
      error:
        "Publishing destination record tidak valid.",
    };
  }

  return {
    ok: true,
    value: {
      id,
      organizationId,
      provider,
      destinationType:
        value.destination_type,
      externalDestinationId,
      displayName,
      status:
        value.status,
      capabilities,
      isSelected:
        value.is_selected,
      createdAt,
      updatedAt,
    },
  };
}

export function publishingDestinationSupports(
  destination: PublishingDestinationRecord,
  capability: PublishingDestinationCapability,
): boolean {
  return (
    destination.status ===
      "active" &&
    destination.capabilities.includes(
      capability,
    )
  );
}

export function publishingDestinationCanExecuteInSg5B1(
  _destination: PublishingDestinationRecord,
): false {
  void _destination;

  return PUBLISHING_EXTERNAL_EXECUTION_ENABLED;
}