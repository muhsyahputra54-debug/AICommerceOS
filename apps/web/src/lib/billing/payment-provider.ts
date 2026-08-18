export type BillingInterval =
  | "monthly"
  | "annual";

export type CommercialPlanSlug =
  | "starter"
  | "pro";

export type BillingCheckoutInput = {
  organizationId: string;
  planSlug: CommercialPlanSlug;
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
};

export type BillingCheckoutSession = {
  provider: string;
  externalSessionId: string;
  checkoutUrl: string;
  expiresAt?: string | null;
};

export type BillingPortalInput = {
  organizationId: string;
  returnUrl: string;
};

export type BillingPortalSession = {
  provider: string;
  portalUrl: string;
};

export interface BillingPaymentProvider {
  readonly name: string;

  createCheckoutSession(
    input: BillingCheckoutInput,
  ): Promise<BillingCheckoutSession>;

  createPortalSession?(
    input: BillingPortalInput,
  ): Promise<BillingPortalSession>;
}

export function isCommercialPlanSlug(
  value: string,
): value is CommercialPlanSlug {
  return value === "starter" || value === "pro";
}

export function isBillingInterval(
  value: string,
): value is BillingInterval {
  return value === "monthly" || value === "annual";
}
