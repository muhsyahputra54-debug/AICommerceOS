export const MAX_INITIAL_ORGANIZATION_NAME_LENGTH =
  100;

export type InitialOrganizationNameValidationError =
  | "name_required"
  | "name_too_long";

export type InitialOrganizationNameValidationResult =
  | {
      ok:
        true;

      name:
        string;
    }
  | {
      ok:
        false;

      error:
        InitialOrganizationNameValidationError;
    };

export function normalizeInitialOrganizationName(
  value:
    unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .replace(
      /\s+/gu,
      " ",
    );
}

export function validateInitialOrganizationName(
  value:
    unknown,
): InitialOrganizationNameValidationResult {
  const name =
    normalizeInitialOrganizationName(
      value,
    );

  if (
    name.length ===
    0
  ) {
    return {
      ok:
        false,

      error:
        "name_required",
    };
  }

  if (
    Array.from(
      name,
    ).length >
    MAX_INITIAL_ORGANIZATION_NAME_LENGTH
  ) {
    return {
      ok:
        false,

      error:
        "name_too_long",
    };
  }

  return {
    ok:
      true,

    name,
  };
}
