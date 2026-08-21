"use client";

import {
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ControlledActionApiRecord } from "@/lib/ai/controlled-action-api";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type ProductCategory = {
  id: string;
  name: string;
};

type EditableProduct = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category_id: string | null;
  price: number | string;
  cost_price: number | string;
  stock: number;
  status: string;
};

type ProductWorkflowCopy =
  Dictionary["products"]["workflow"];

type EditProductFormProps = {
  organizationId: string;
  product: EditableProduct;
  categories: ProductCategory[];
  copy: ProductWorkflowCopy;
  canUseControlledActions: boolean;
};

type ControlledNameAction =
  Extract<
    ControlledActionApiRecord,
    {
      actionType: "product.update_name";
    }
  >;

type ControlledStatusAction =
  Extract<
    ControlledActionApiRecord,
    {
      actionType: "product.update_status";
    }
  >;

type ProductStatus =
  "active" | "inactive";

type ControlledActionResponse = {
  action?: ControlledActionApiRecord;
  error?: string;
};

export default function EditProductForm({
  organizationId,
  product,
  categories,
  copy,
  canUseControlledActions,
}: EditProductFormProps) {
  const router = useRouter();

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  const [
    controlledName,
    setControlledName,
  ] = useState("");

  const [
    controlledNameAction,
    setControlledNameAction,
  ] =
    useState<ControlledNameAction | null>(
      null,
    );

  const [
    controlledNameBusy,
    setControlledNameBusy,
  ] =
    useState<
      "propose" | "confirm" | "execute" | null
    >(null);

  const [
    controlledNameMessage,
    setControlledNameMessage,
  ] =
    useState<string | null>(null);

  const [
    controlledStatus,
    setControlledStatus,
  ] =
    useState<ProductStatus>(
      product.status === "inactive"
        ? "active"
        : "inactive",
    );

  const [
    controlledStatusAction,
    setControlledStatusAction,
  ] =
    useState<ControlledStatusAction | null>(
      null,
    );

  const [
    controlledStatusBusy,
    setControlledStatusBusy,
  ] =
    useState<
      "propose" | "confirm" | "execute" | null
    >(null);

  const [
    controlledStatusMessage,
    setControlledStatusMessage,
  ] =
    useState<string | null>(null);

  const controlledNameProposalKey =
    useRef<{
      signature: string;
      key: string;
    } | null>(null);

  const controlledStatusProposalKey =
    useRef<{
      signature: string;
      key: string;
    } | null>(null);

  function getControlledNameProposalKey(
    proposedName: string,
  ) {
    const signature =
      JSON.stringify([
        product.name,
        proposedName,
      ]);

    const existing =
      controlledNameProposalKey.current;

    if (
      existing?.signature ===
      signature
    ) {
      return existing.key;
    }

    const created = {
      signature,
      key: [
        "product-name",
        product.id,
        crypto.randomUUID(),
      ].join(":"),
    };

    controlledNameProposalKey.current =
      created;

    return created.key;
  }

  function getControlledStatusProposalKey(
    expectedStatus: ProductStatus,
    proposedStatus: ProductStatus,
  ) {
    const signature =
      JSON.stringify([
        expectedStatus,
        proposedStatus,
      ]);

    const existing =
      controlledStatusProposalKey.current;

    if (
      existing?.signature ===
      signature
    ) {
      return existing.key;
    }

    const created = {
      signature,
      key: [
        "product-status",
        product.id,
        crypto.randomUUID(),
      ].join(":"),
    };

    controlledStatusProposalKey.current =
      created;

    return created.key;
  }

  async function readControlledActionResponse(
    response: Response,
  ) {
    return (
      await response
        .json()
        .catch(() => ({}))
    ) as ControlledActionResponse;
  }

  function nameActionFrom(
    response: ControlledActionResponse,
  ): ControlledNameAction | null {
    const action =
      response.action;

    return action?.actionType ===
      "product.update_name"
      ? action
      : null;
  }

  function statusActionFrom(
    response: ControlledActionResponse,
  ): ControlledStatusAction | null {
    const action =
      response.action;

    return action?.actionType ===
      "product.update_status"
      ? action
      : null;
  }

  async function handleReviewControlledName() {
    if (!canUseControlledActions) {
      setControlledNameMessage(
        copy.edit.controlledName
          .ownerAdminOnly,
      );
      return;
    }

    const proposedName =
      controlledName.trim();

    if (!proposedName) {
      setControlledNameMessage(
        copy.validation.nameRequired,
      );
      return;
    }

    if (proposedName === product.name) {
      setControlledNameMessage(
        copy.edit.controlledName.sameName,
      );
      return;
    }

    setControlledNameMessage(null);
    setControlledNameBusy("propose");

    const idempotencyKey =
      getControlledNameProposalKey(
        proposedName,
      );

    try {
      const response =
        await fetch(
          "/api/ai/controlled-actions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              actionType:
                "product.update_name",
              productId:
                product.id,
              expectedName:
                product.name,
              proposedName,
              idempotencyKey,
            }),
          },
        );

      const data =
        await readControlledActionResponse(
          response,
        );

      const action =
        nameActionFrom(data);

      if (!response.ok || !action) {
        if (
          response.status >= 400 &&
          response.status < 500
        ) {
          controlledNameProposalKey.current =
            null;
        }

        setControlledNameMessage(
          response.status === 409
            ? copy.edit.controlledName
                .staleMessage
            : copy.edit.controlledName
                .prepareFailed,
        );

        if (response.status === 409) {
          router.refresh();
        }

        return;
      }

      setControlledName(
        action.proposedName,
      );

      setControlledNameAction(
        action,
      );

      setControlledNameMessage(
        copy.edit.controlledName
          .previewReady,
      );
    } catch {
      setControlledNameMessage(
        copy.edit.controlledName
          .prepareFailed,
      );
    } finally {
      setControlledNameBusy(null);
    }
  }

  async function handleConfirmControlledName() {
    if (
      !canUseControlledActions ||
      !controlledNameAction ||
      controlledNameAction.status !==
        "proposed"
    ) {
      return;
    }

    setControlledNameMessage(null);
    setControlledNameBusy("confirm");

    try {
      const response =
        await fetch(
          `/api/ai/controlled-actions/${controlledNameAction.id}/confirm`,
          {
            method: "POST",
          },
        );

      const data =
        await readControlledActionResponse(
          response,
        );

      const action =
        nameActionFrom(data);

      if (
        !response.ok ||
        !action ||
        action.status !== "confirmed"
      ) {
        setControlledNameMessage(
          copy.edit.controlledName
            .confirmFailed,
        );
        return;
      }

      setControlledNameAction(
        action,
      );

      setControlledNameMessage(
        copy.edit.controlledName
          .confirmedMessage,
      );
    } catch {
      setControlledNameMessage(
        copy.edit.controlledName
          .confirmFailed,
      );
    } finally {
      setControlledNameBusy(null);
    }
  }

  async function handleExecuteControlledName() {
    if (
      !canUseControlledActions ||
      !controlledNameAction ||
      controlledNameAction.status !==
        "confirmed"
    ) {
      return;
    }

    setControlledNameMessage(null);
    setControlledNameBusy("execute");

    try {
      const response =
        await fetch(
          `/api/ai/controlled-actions/${controlledNameAction.id}/execute`,
          {
            method: "POST",
          },
        );

      const data =
        await readControlledActionResponse(
          response,
        );

      const action =
        nameActionFrom(data);

      if (!action) {
        setControlledNameMessage(
          copy.edit.controlledName
            .executeFailed,
        );
        return;
      }

      setControlledNameAction(
        action,
      );

      if (
        action.status ===
        "executed"
      ) {
        controlledNameProposalKey.current =
          null;

        setControlledNameMessage(
          copy.edit.controlledName
            .executedMessage,
        );

        router.refresh();
        return;
      }

      if (
        action.status ===
        "stale"
      ) {
        controlledNameProposalKey.current =
          null;

        setControlledNameMessage(
          copy.edit.controlledName
            .staleMessage,
        );

        router.refresh();
        return;
      }

      if (
        action.status ===
          "failed" ||
        !response.ok
      ) {
        controlledNameProposalKey.current =
          null;

        setControlledNameMessage(
          copy.edit.controlledName
            .executeFailed,
        );
      }
    } catch {
      setControlledNameMessage(
        copy.edit.controlledName
          .executeFailed,
      );
    } finally {
      setControlledNameBusy(null);
    }
  }

  async function handleReviewControlledStatus() {
    if (!canUseControlledActions) {
      setControlledStatusMessage(
        copy.edit.controlledStatus
          .ownerAdminOnly,
      );
      return;
    }

    const expectedStatus: ProductStatus =
      product.status === "inactive"
        ? "inactive"
        : "active";

    const proposedStatus =
      controlledStatus;

    if (
      proposedStatus ===
      expectedStatus
    ) {
      setControlledStatusMessage(
        copy.edit.controlledStatus
          .sameStatus,
      );
      return;
    }

    setControlledStatusMessage(null);
    setControlledStatusBusy("propose");

    const idempotencyKey =
      getControlledStatusProposalKey(
        expectedStatus,
        proposedStatus,
      );

    try {
      const response =
        await fetch(
          "/api/ai/controlled-actions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              actionType:
                "product.update_status",
              productId:
                product.id,
              expectedStatus,
              proposedStatus,
              idempotencyKey,
            }),
          },
        );

      const data =
        await readControlledActionResponse(
          response,
        );

      const action =
        statusActionFrom(data);

      if (!response.ok || !action) {
        if (
          response.status >= 400 &&
          response.status < 500
        ) {
          controlledStatusProposalKey.current =
            null;
        }

        setControlledStatusMessage(
          response.status === 409
            ? copy.edit
                .controlledStatus
                .staleMessage
            : copy.edit
                .controlledStatus
                .prepareFailed,
        );

        if (response.status === 409) {
          router.refresh();
        }

        return;
      }

      setControlledStatus(
        action.proposedStatus,
      );

      setControlledStatusAction(
        action,
      );

      setControlledStatusMessage(
        copy.edit.controlledStatus
          .previewReady,
      );
    } catch {
      setControlledStatusMessage(
        copy.edit.controlledStatus
          .prepareFailed,
      );
    } finally {
      setControlledStatusBusy(null);
    }
  }

  async function handleConfirmControlledStatus() {
    if (
      !canUseControlledActions ||
      !controlledStatusAction ||
      controlledStatusAction.status !==
        "proposed"
    ) {
      return;
    }

    setControlledStatusMessage(null);
    setControlledStatusBusy("confirm");

    try {
      const response =
        await fetch(
          `/api/ai/controlled-actions/${controlledStatusAction.id}/confirm`,
          {
            method: "POST",
          },
        );

      const data =
        await readControlledActionResponse(
          response,
        );

      const action =
        statusActionFrom(data);

      if (
        !response.ok ||
        !action ||
        action.status !== "confirmed"
      ) {
        setControlledStatusMessage(
          copy.edit.controlledStatus
            .confirmFailed,
        );
        return;
      }

      setControlledStatusAction(
        action,
      );

      setControlledStatusMessage(
        copy.edit.controlledStatus
          .confirmedMessage,
      );
    } catch {
      setControlledStatusMessage(
        copy.edit.controlledStatus
          .confirmFailed,
      );
    } finally {
      setControlledStatusBusy(null);
    }
  }

  async function handleExecuteControlledStatus() {
    if (
      !canUseControlledActions ||
      !controlledStatusAction ||
      controlledStatusAction.status !==
        "confirmed"
    ) {
      return;
    }

    setControlledStatusMessage(null);
    setControlledStatusBusy("execute");

    try {
      const response =
        await fetch(
          `/api/ai/controlled-actions/${controlledStatusAction.id}/execute`,
          {
            method: "POST",
          },
        );

      const data =
        await readControlledActionResponse(
          response,
        );

      const action =
        statusActionFrom(data);

      if (!action) {
        setControlledStatusMessage(
          copy.edit.controlledStatus
            .executeFailed,
        );
        return;
      }

      setControlledStatusAction(
        action,
      );

      if (
        action.status ===
        "executed"
      ) {
        controlledStatusProposalKey.current =
          null;

        setControlledStatusMessage(
          copy.edit.controlledStatus
            .executedMessage,
        );

        router.refresh();
        return;
      }

      if (
        action.status ===
        "stale"
      ) {
        controlledStatusProposalKey.current =
          null;

        setControlledStatusMessage(
          copy.edit.controlledStatus
            .staleMessage,
        );

        router.refresh();
        return;
      }

      if (
        action.status ===
          "failed" ||
        !response.ok
      ) {
        controlledStatusProposalKey.current =
          null;

        setControlledStatusMessage(
          copy.edit.controlledStatus
            .executeFailed,
        );
      }
    } catch {
      setControlledStatusMessage(
        copy.edit.controlledStatus
          .executeFailed,
      );
    } finally {
      setControlledStatusBusy(null);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData =
      new FormData(event.currentTarget);

    const name = String(
      formData.get("name") ?? "",
    ).trim();

    const description = String(
      formData.get("description") ?? "",
    ).trim();

    const sku = String(
      formData.get("sku") ?? "",
    ).trim();

    const categoryId = String(
      formData.get("category_id") ?? "",
    ).trim();

    const price = Number(
      formData.get("price"),
    );

    const costPrice = Number(
      formData.get("cost_price"),
    );

    const stock = Number(
      formData.get("stock"),
    );

    const status = String(
      formData.get("status") ?? "",
    );

    if (!name) {
      setErrorMessage(
        copy.validation.nameRequired,
      );

      setIsSubmitting(false);
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setErrorMessage(
        copy.validation.priceInvalid,
      );

      setIsSubmitting(false);
      return;
    }

    if (
      !Number.isFinite(costPrice) ||
      costPrice < 0
    ) {
      setErrorMessage(
        copy.validation.costPriceInvalid,
      );

      setIsSubmitting(false);
      return;
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setErrorMessage(
        copy.validation.stockInvalid,
      );

      setIsSubmitting(false);
      return;
    }

    if (
      status !== "active" &&
      status !== "inactive"
    ) {
      setErrorMessage(
        copy.validation.statusInvalid,
      );

      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { data, error } =
      await supabase
        .from("products")
        .update({
          name,
          description:
            description || null,
          sku: sku || null,
          category_id:
            categoryId || null,
          price,
          cost_price: costPrice,
          stock,
          status,
        })
        .eq("id", product.id)
        .eq(
          "organization_id",
          organizationId,
        )
        .select("id")
        .maybeSingle();

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? copy.validation.skuInUse
          : error.message,
      );

      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        copy.validation.notFound,
      );

      setIsSubmitting(false);
      return;
    }

    router.push("/products");
    router.refresh();
  }

  const controlledNameCandidate =
    controlledName.trim();

  const controlledNameActive =
    controlledNameAction?.status ===
      "proposed" ||
    controlledNameAction?.status ===
      "confirmed" ||
    controlledNameAction?.status ===
      "executing";

  const currentControlledStatus:
    ProductStatus =
      product.status === "inactive"
        ? "inactive"
        : "active";

  const controlledStatusActive =
    controlledStatusAction?.status ===
      "proposed" ||
    controlledStatusAction?.status ===
      "confirmed" ||
    controlledStatusAction?.status ===
      "executing";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="name"
            className="text-sm font-medium"
          >
            {copy.fields.productName}
          </label>

          <Input
            key={product.name}
            id="name"
            name="name"
            type="text"
            defaultValue={product.name}
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="sku"
            className="text-sm font-medium"
          >
            {copy.fields.sku}
          </label>

          <Input
            id="sku"
            name="sku"
            type="text"
            defaultValue={
              product.sku ?? ""
            }
            placeholder={
              copy.fields.skuPlaceholder
            }
          />

          <p className="text-xs text-muted-foreground">
            {copy.fields.skuHelp}
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="category_id"
            className="text-sm font-medium"
          >
            {copy.fields.category}
          </label>

          <select
            id="category_id"
            name="category_id"
            defaultValue={
              product.category_id ?? ""
            }
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">
              {copy.fields.noCategory}
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="description"
            className="text-sm font-medium"
          >
            {copy.fields.description}
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={
              product.description ?? ""
            }
            placeholder={
              copy.fields
                .descriptionPlaceholder
            }
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="price"
            className="text-sm font-medium"
          >
            {copy.fields.sellingPrice}
          </label>

          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={
              String(product.price)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="cost_price"
            className="text-sm font-medium"
          >
            {copy.fields.costPrice}
          </label>

          <Input
            id="cost_price"
            name="cost_price"
            type="number"
            min="0"
            step="1"
            defaultValue={
              String(product.cost_price)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="stock"
            className="text-sm font-medium"
          >
            {copy.fields.stock}
          </label>

          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={
              String(product.stock)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="status"
            className="text-sm font-medium"
          >
            {copy.fields.status}
          </label>

          <select
            id="status"
            name="status"
            defaultValue={
              product.status ===
              "inactive"
                ? "inactive"
                : "active"
            }
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="active">
              {copy.fields.active}
            </option>

            <option value="inactive">
              {copy.fields.inactive}
            </option>
          </select>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
        <div>
          <h2 className="font-medium">
            {
              copy.edit.controlledName
                .title
            }
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {
              copy.edit.controlledName
                .description
            }
          </p>
        </div>

        {!canUseControlledActions ? (
          <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
            {
              copy.edit.controlledName
                .ownerAdminOnly
            }
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label
                htmlFor="controlled_product_name"
                className="text-sm font-medium"
              >
                {
                  copy.edit.controlledName
                    .label
                }
              </label>

              <Input
                id="controlled_product_name"
                type="text"
                value={controlledName}
                placeholder={
                  copy.edit.controlledName
                    .placeholder
                }
                disabled={
                  controlledNameBusy !==
                    null ||
                  controlledNameActive
                }
                onChange={(event) => {
                  setControlledName(
                    event.target.value,
                  );

                  setControlledNameAction(
                    null,
                  );

                  setControlledNameMessage(
                    null,
                  );

                  controlledNameProposalKey.current =
                    null;
                }}
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();
                  }
                }}
              />
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                disabled={
                  controlledNameBusy !==
                    null ||
                  controlledNameActive ||
                  !controlledNameCandidate ||
                  controlledNameCandidate ===
                    product.name
                }
                onClick={
                  handleReviewControlledName
                }
              >
                {controlledNameBusy ===
                "propose"
                  ? copy.edit
                      .controlledName
                      .reviewing
                  : copy.edit
                      .controlledName
                      .review}
              </Button>
            </div>
          </>
        )}

        {controlledNameAction ? (
          <div className="space-y-4 rounded-xl border bg-background p-4">
            <div className="text-xs text-muted-foreground">
              {
                copy.edit.controlledName
                  .status
              }
              {": "}
              {
                copy.edit.controlledName
                  .statuses[
                    controlledNameAction
                      .status
                  ]
              }
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium">
                  {
                    copy.edit
                      .controlledName
                      .before
                  }
                </div>

                <div className="mt-2 min-h-16 whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm">
                  {
                    controlledNameAction
                      .expectedName
                  }
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">
                  {
                    copy.edit
                      .controlledName
                      .after
                  }
                </div>

                <div className="mt-2 min-h-16 whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm">
                  {
                    controlledNameAction
                      .proposedName
                  }
                </div>
              </div>
            </div>

            {controlledNameAction.status ===
            "proposed" ? (
              <Button
                type="button"
                disabled={
                  controlledNameBusy !==
                  null
                }
                onClick={
                  handleConfirmControlledName
                }
              >
                {controlledNameBusy ===
                "confirm"
                  ? copy.edit
                      .controlledName
                      .confirming
                  : copy.edit
                      .controlledName
                      .confirm}
              </Button>
            ) : null}

            {controlledNameAction.status ===
            "confirmed" ? (
              <Button
                type="button"
                disabled={
                  controlledNameBusy !==
                  null
                }
                onClick={
                  handleExecuteControlledName
                }
              >
                {controlledNameBusy ===
                "execute"
                  ? copy.edit
                      .controlledName
                      .executing
                  : copy.edit
                      .controlledName
                      .execute}
              </Button>
            ) : null}
          </div>
        ) : null}

        {controlledNameMessage ? (
          <p className="text-sm text-muted-foreground">
            {controlledNameMessage}
          </p>
        ) : null}
      </div>

      <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
        <div>
          <h2 className="font-medium">
            {
              copy.edit.controlledStatus
                .title
            }
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {
              copy.edit.controlledStatus
                .description
            }
          </p>
        </div>

        {!canUseControlledActions ? (
          <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
            {
              copy.edit.controlledStatus
                .ownerAdminOnly
            }
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label
                htmlFor="controlled_product_status"
                className="text-sm font-medium"
              >
                {
                  copy.edit.controlledStatus
                    .label
                }
              </label>

              <select
                id="controlled_product_status"
                value={controlledStatus}
                disabled={
                  controlledStatusBusy !==
                    null ||
                  controlledStatusActive
                }
                onChange={(event) => {
                  const nextStatus =
                    event.target.value;

                  if (
                    nextStatus !==
                      "active" &&
                    nextStatus !==
                      "inactive"
                  ) {
                    return;
                  }

                  setControlledStatus(
                    nextStatus,
                  );

                  setControlledStatusAction(
                    null,
                  );

                  setControlledStatusMessage(
                    null,
                  );

                  controlledStatusProposalKey.current =
                    null;
                }}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="active">
                  {copy.fields.active}
                </option>

                <option value="inactive">
                  {copy.fields.inactive}
                </option>
              </select>
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                disabled={
                  controlledStatusBusy !==
                    null ||
                  controlledStatusActive ||
                  controlledStatus ===
                    currentControlledStatus
                }
                onClick={
                  handleReviewControlledStatus
                }
              >
                {controlledStatusBusy ===
                "propose"
                  ? copy.edit
                      .controlledStatus
                      .reviewing
                  : copy.edit
                      .controlledStatus
                      .review}
              </Button>
            </div>
          </>
        )}

        {controlledStatusAction ? (
          <div className="space-y-4 rounded-xl border bg-background p-4">
            <div className="text-xs text-muted-foreground">
              {
                copy.edit.controlledStatus
                  .status
              }
              {": "}
              {
                copy.edit.controlledStatus
                  .statuses[
                    controlledStatusAction
                      .status
                  ]
              }
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium">
                  {
                    copy.edit
                      .controlledStatus
                      .before
                  }
                </div>

                <div className="mt-2 rounded-lg border bg-muted/20 p-3 text-sm">
                  {controlledStatusAction
                    .expectedStatus ===
                  "active"
                    ? copy.fields.active
                    : copy.fields.inactive}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">
                  {
                    copy.edit
                      .controlledStatus
                      .after
                  }
                </div>

                <div className="mt-2 rounded-lg border bg-muted/20 p-3 text-sm">
                  {controlledStatusAction
                    .proposedStatus ===
                  "active"
                    ? copy.fields.active
                    : copy.fields.inactive}
                </div>
              </div>
            </div>

            {controlledStatusAction.status ===
            "proposed" ? (
              <Button
                type="button"
                disabled={
                  controlledStatusBusy !==
                  null
                }
                onClick={
                  handleConfirmControlledStatus
                }
              >
                {controlledStatusBusy ===
                "confirm"
                  ? copy.edit
                      .controlledStatus
                      .confirming
                  : copy.edit
                      .controlledStatus
                      .confirm}
              </Button>
            ) : null}

            {controlledStatusAction.status ===
            "confirmed" ? (
              <Button
                type="button"
                disabled={
                  controlledStatusBusy !==
                  null
                }
                onClick={
                  handleExecuteControlledStatus
                }
              >
                {controlledStatusBusy ===
                "execute"
                  ? copy.edit
                      .controlledStatus
                      .executing
                  : copy.edit
                      .controlledStatus
                      .execute}
              </Button>
            ) : null}
          </div>
        ) : null}

        {controlledStatusMessage ? (
          <p className="text-sm text-muted-foreground">
            {controlledStatusMessage}
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push("/products")
          }
          disabled={isSubmitting}
        >
          {copy.actions.cancel}
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? copy.actions.saving
            : copy.edit.saveChanges}
        </Button>
      </div>
    </form>
  );
}
