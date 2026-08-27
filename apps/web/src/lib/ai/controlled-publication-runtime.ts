import {
  CONTROLLED_PUBLICATION_STATUSES,
  projectControlledPublicationRecord,
  type ControlledPublicationRecord,
  type ControlledPublicationStatus,
} from "./controlled-publication";

import {
  projectControlledPublicationChannelRecord,
  type ControlledPublicationChannelRecord,
} from "./controlled-publication-channel-target";

export type ControlledPublicationChannelApiRecord =
  ControlledPublicationChannelRecord & {
    status:
      ControlledPublicationStatus;

    expectedValue:
      null;

    requestedByUserId:
      string;

    confirmedByUserId:
      string | null;

    createdAt:
      string;

    confirmedAt:
      string | null;

    finalizedAt:
      string | null;

    errorMessage:
      string | null;
  };

export type ControlledPublicationApiRecord =
  | ControlledPublicationRecord
  | ControlledPublicationChannelApiRecord;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    !UUID_PATTERN.test(
      value.trim(),
    )
  ) {
    return null;
  }

  return value
    .trim()
    .toLowerCase();
}

function requiredString(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  return value;
}

function nullableString(
  value: unknown,
): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

function isControlledPublicationStatus(
  value: unknown,
): value is ControlledPublicationStatus {
  return (
    typeof value === "string" &&
    (
      CONTROLLED_PUBLICATION_STATUSES as
        readonly string[]
    ).includes(
      value,
    )
  );
}

function channelLifecycleIsValid(
  status: ControlledPublicationStatus,
  confirmedByUserId: string | null,
  confirmedAt: string | null,
  finalizedAt: string | null,
  errorMessage: string | null,
): boolean {
  if (
    status === "proposed"
  ) {
    return (
      confirmedByUserId === null &&
      confirmedAt === null &&
      finalizedAt === null &&
      errorMessage === null
    );
  }

  if (
    status === "confirmed"
  ) {
    return (
      confirmedByUserId !== null &&
      confirmedAt !== null &&
      finalizedAt === null &&
      errorMessage === null
    );
  }

  return finalizedAt !== null;
}

export function projectControlledPublicationApiRecord(
  value: unknown,
): ControlledPublicationApiRecord | null {
  const legacy =
    projectControlledPublicationRecord(
      value,
    );

  if (legacy) {
    return legacy;
  }

  const channel =
    projectControlledPublicationChannelRecord(
      value,
    );

  if (
    !channel ||
    !isRecord(value) ||
    value.expected_value !== null ||
    !isControlledPublicationStatus(
      value.status,
    )
  ) {
    return null;
  }

  const requestedByUserId =
    requiredUuid(
      value.requested_by_user_id,
    );

  const confirmedByUserId =
    value.confirmed_by_user_id === null
      ? null
      : requiredUuid(
          value.confirmed_by_user_id,
        );

  const createdAt =
    requiredString(
      value.created_at,
    );

  const confirmedAt =
    nullableString(
      value.confirmed_at,
    );

  const finalizedAt =
    nullableString(
      value.finalized_at,
    );

  const errorMessage =
    nullableString(
      value.error_message,
    );

  if (
    !requestedByUserId ||
    (
      value.confirmed_by_user_id !== null &&
      !confirmedByUserId
    ) ||
    !createdAt ||
    confirmedAt === undefined ||
    finalizedAt === undefined ||
    errorMessage === undefined
  ) {
    return null;
  }

  if (
    !channelLifecycleIsValid(
      value.status,
      confirmedByUserId,
      confirmedAt,
      finalizedAt,
      errorMessage,
    )
  ) {
    return null;
  }

  return {
    ...channel,

    status:
      value.status,

    expectedValue:
      null,

    requestedByUserId,

    confirmedByUserId,

    createdAt,

    confirmedAt,

    finalizedAt,

    errorMessage,
  };
}
