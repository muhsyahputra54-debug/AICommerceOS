type StructuredServerErrorInput = {
  event: string;
  requestId?: string | null;
  route?: string;
  method?: string;
  provider?: string;
  operation?: string;
  error?: unknown;
};

type ErrorLike = {
  name?: unknown;
  code?: unknown;
  message?: unknown;
};

function safeString(
  value: unknown,
  maximumLength = 500,
) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/[\r\n\t]+/g, " ")
    .trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(
    0,
    maximumLength,
  );
}

function errorFields(error: unknown) {
  if (!error) {
    return {
      error_name: null,
      error_code: null,
      error_message: null,
    };
  }

  if (error instanceof Error) {
    return {
      error_name:
        safeString(error.name, 100),
      error_code: null,
      error_message:
        safeString(error.message),
    };
  }

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate =
      error as ErrorLike;

    return {
      error_name:
        safeString(candidate.name, 100),
      error_code:
        safeString(candidate.code, 100),
      error_message:
        safeString(candidate.message),
    };
  }

  return {
    error_name: null,
    error_code: null,
    error_message:
      safeString(String(error)),
  };
}

export function logServerError({
  event,
  requestId = null,
  route,
  method,
  provider,
  operation,
  error,
}: StructuredServerErrorInput) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: "error",
    service: "aicommerceos-web",
    event: safeString(event, 150),
    request_id:
      safeString(requestId, 128),
    route: safeString(route, 250),
    method: safeString(method, 20),
    provider:
      safeString(provider, 100),
    operation:
      safeString(operation, 150),
    ...errorFields(error),
  };

  console.error(JSON.stringify(entry));
}
