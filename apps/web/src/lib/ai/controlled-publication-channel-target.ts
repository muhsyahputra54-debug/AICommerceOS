import {
  type PublishingDestinationRecord,
  publishingDestinationSupports,
} from "./publishing-destination";

export const CONTROLLED_PUBLICATION_CHANNEL_CONTRACT_VERSION =
  2 as const;

export const CONTROLLED_PUBLICATION_CHANNEL_ACTION_TYPE =
  "content.publish_text" as const;

export const CONTROLLED_PUBLICATION_CHANNEL_TARGET_RESOURCE =
  "publishing_channel_destination" as const;

export const CONTROLLED_PUBLICATION_CHANNEL_MUTATION_FIELD =
  "content" as const;

export const CONTROLLED_PUBLICATION_CHANNEL_REQUIRED_CAPABILITY =
  "publish_text" as const;

export const CONTROLLED_PUBLICATION_CHANNEL_MAX_CONTENT_LENGTH =
  5000 as const;

export const CONTROLLED_PUBLICATION_CHANNEL_MAX_IDEMPOTENCY_KEY_LENGTH =
  128 as const;

/*
 * SG5-B2B1 defines the compatible channel-target contract only.
 *
 * Runtime routing remains on the SG4 legacy proposal path until
 * a separate database authorization/apply gate and a later source
 * integration gate both pass.
 */
export const CONTROLLED_PUBLICATION_CHANNEL_EXECUTION_ENABLED =
  false as const;

export type ControlledPublicationChannelProposalInput = {
  actionType:
    typeof CONTROLLED_PUBLICATION_CHANNEL_ACTION_TYPE;

  publishingDestinationId:
    string;

  content:
    string;

  idempotencyKey:
    string;
};

export type ControlledPublicationChannelRecord = {
  id:
    string;

  contractVersion:
    typeof CONTROLLED_PUBLICATION_CHANNEL_CONTRACT_VERSION;

  actionType:
    typeof CONTROLLED_PUBLICATION_CHANNEL_ACTION_TYPE;

  targetResource:
    typeof CONTROLLED_PUBLICATION_CHANNEL_TARGET_RESOURCE;

  targetId:
    string;

  mutationField:
    typeof CONTROLLED_PUBLICATION_CHANNEL_MUTATION_FIELD;

  proposedValue:
    string;

  destination: {
    provider:
      string;

    destinationType:
      "account" | "page" | "channel";

    externalDestinationId:
      string;

    name:
      string;
  };
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

const IDEMPOTENCY_KEY_PATTERN =
  /^[A-Za-z0-9._:-]+$/;

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

function normalizedNonBlank(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

export function normalizeControlledPublicationChannelContent(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value
      .replace(
        /\r\n/g,
        "\n",
      )
      .replace(
        /\r/g,
        "\n",
      )
      .trim();

  if (
    !normalized ||
    normalized.length >
      CONTROLLED_PUBLICATION_CHANNEL_MAX_CONTENT_LENGTH
  ) {
    return null;
  }

  return normalized;
}

export function normalizeControlledPublicationChannelIdempotencyKey(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized.length < 8 ||
    normalized.length >
      CONTROLLED_PUBLICATION_CHANNEL_MAX_IDEMPOTENCY_KEY_LENGTH ||
    !IDEMPOTENCY_KEY_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

export function parseControlledPublicationChannelProposal(
  value: unknown,
): ParseResult<ControlledPublicationChannelProposalInput> {
  if (!isRecord(value)) {
    return {
      ok: false,
      error:
        "Controlled publication channel payload tidak valid.",
    };
  }

  if (
    value.actionType !==
    CONTROLLED_PUBLICATION_CHANNEL_ACTION_TYPE
  ) {
    return {
      ok: false,
      error:
        "Controlled publication action type tidak didukung.",
    };
  }

  const publishingDestinationId =
    requiredUuid(
      value.publishingDestinationId,
    );

  if (!publishingDestinationId) {
    return {
      ok: false,
      error:
        "Publishing destination ID tidak valid.",
    };
  }

  const content =
    normalizeControlledPublicationChannelContent(
      value.content,
    );

  if (!content) {
    return {
      ok: false,
      error:
        "Publication content tidak valid.",
    };
  }

  const idempotencyKey =
    normalizeControlledPublicationChannelIdempotencyKey(
      value.idempotencyKey,
    );

  if (!idempotencyKey) {
    return {
      ok: false,
      error:
        "Controlled publication idempotency key tidak valid.",
    };
  }

  return {
    ok: true,
    value: {
      actionType:
        CONTROLLED_PUBLICATION_CHANNEL_ACTION_TYPE,

      publishingDestinationId,

      content,

      idempotencyKey,
    },
  };
}

export function controlledPublicationChannelDestinationIsCompatible(
  destination: PublishingDestinationRecord,
): boolean {
  return publishingDestinationSupports(
    destination,
    CONTROLLED_PUBLICATION_CHANNEL_REQUIRED_CAPABILITY,
  );
}

export function projectControlledPublicationChannelRecord(
  value: unknown,
): ControlledPublicationChannelRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.contract_version !==
      CONTROLLED_PUBLICATION_CHANNEL_CONTRACT_VERSION ||
    value.action_type !==
      CONTROLLED_PUBLICATION_CHANNEL_ACTION_TYPE ||
    value.target_resource !==
      CONTROLLED_PUBLICATION_CHANNEL_TARGET_RESOURCE ||
    value.mutation_field !==
      CONTROLLED_PUBLICATION_CHANNEL_MUTATION_FIELD
  ) {
    return null;
  }

  const id =
    requiredUuid(
      value.id,
    );

  const targetId =
    requiredUuid(
      value.target_id,
    );

  const proposedValue =
    normalizeControlledPublicationChannelContent(
      value.proposed_value,
    );

  const provider =
    normalizedNonBlank(
      value.provider,
    );

  const destinationType =
    value.destination_type;

  const externalDestinationId =
    normalizedNonBlank(
      value.external_shop_id,
    );

  const name =
    normalizedNonBlank(
      value.destination_name,
    );

  if (
    !id ||
    !targetId ||
    !proposedValue ||
    !provider ||
    provider !== provider.toLowerCase() ||
    (
      destinationType !== "account" &&
      destinationType !== "page" &&
      destinationType !== "channel"
    ) ||
    !externalDestinationId ||
    !name
  ) {
    return null;
  }

  return {
    id,

    contractVersion:
      CONTROLLED_PUBLICATION_CHANNEL_CONTRACT_VERSION,

    actionType:
      CONTROLLED_PUBLICATION_CHANNEL_ACTION_TYPE,

    targetResource:
      CONTROLLED_PUBLICATION_CHANNEL_TARGET_RESOURCE,

    targetId,

    mutationField:
      CONTROLLED_PUBLICATION_CHANNEL_MUTATION_FIELD,

    proposedValue,

    destination: {
      provider,

      destinationType,

      externalDestinationId,

      name,
    },
  };
}

export function controlledPublicationChannelCanExecuteInB2B1(
  _record: ControlledPublicationChannelRecord,
): false {
  void _record;

  return CONTROLLED_PUBLICATION_CHANNEL_EXECUTION_ENABLED;
}