type StructuredServerErrorInput = {
  event: string;
  requestId?: string | null;
  route?: string;
  method?: string;
  provider?: string;
  operation?: string;
  errorDigest?: string | null;
  routerKind?: string | null;
  routeType?: string | null;
  runtime?: string | null;
  error?: unknown;
};

type ErrorLike = {
  name?: unknown;
  code?: unknown;
  message?: unknown;
};

const SENSITIVE_TEXT_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(access[_-]?token|refresh[_-]?token|client[_-]?secret|authorization|cookie|oauth[_-]?(?:code|state)|publish[_-]?id|upload[_-]?url|ciphertext|encryption[_-]?key)\b\s*[:=]\s*["']?[^,\s;"']+/gi,
] as const;

function redactSensitiveText(
  value: string,
): string {
  return SENSITIVE_TEXT_PATTERNS.reduce(
    (current, pattern) =>
      current.replace(
        pattern,
        (match) => {
          const separatorIndex =
            Math.max(
              match.indexOf(":"),
              match.indexOf("="),
            );

          if (separatorIndex >= 0) {
            return `${match.slice(
              0,
              separatorIndex + 1,
            )}[REDACTED]`;
          }

          if (
            /^Bearer\s+/i.test(
              match,
            )
          ) {
            return "Bearer [REDACTED]";
          }

          return "[REDACTED]";
        },
      ),
    value,
  );
}

function safeString(
  value: unknown,
  maximumLength = 500,
) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    redactSensitiveText(
      value,
    )
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
  errorDigest = null,
  routerKind = null,
  routeType = null,
  runtime = null,
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
    error_digest:
      safeString(errorDigest, 150),
    router_kind:
      safeString(routerKind, 50),
    route_type:
      safeString(routeType, 50),
    runtime:
      safeString(runtime, 50),
    ...errorFields(error),
  };

  console.error(JSON.stringify(entry));
}
