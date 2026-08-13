"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type ProductImage = {
  id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  signed_url: string | null;
};

type ProductImageManagerProps = {
  organizationId: string;
  productId: string;
  productName: string;
  images: ProductImage[];
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProductImageManager({
  organizationId,
  productId,
  productName,
  images,
}: ProductImageManagerProps) {
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fileValue = formData.get("image");
    const altText = String(formData.get("alt_text") ?? "").trim();

    if (!(fileValue instanceof File) || fileValue.size === 0) {
      setErrorMessage("Pilih file gambar terlebih dahulu.");
      return;
    }

    if (!allowedMimeTypes.has(fileValue.type)) {
      setErrorMessage(
        "Format gambar harus JPEG, PNG, WebP, atau GIF.",
      );
      return;
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      setErrorMessage("Ukuran gambar maksimal 5 MB.");
      return;
    }

    const extension = extensionForMimeType(fileValue.type);

    if (!extension) {
      setErrorMessage("Format gambar tidak didukung.");
      return;
    }

    setIsUploading(true);

    const supabase = createClient();

    const storagePath =
      `${organizationId}/${productId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, fileValue, {
        cacheControl: "3600",
        contentType: fileValue.type,
        upsert: false,
      });

    if (uploadError) {
      setErrorMessage(uploadError.message);
      setIsUploading(false);
      return;
    }

    const { error: metadataError } = await supabase
      .from("product_images")
      .insert({
        organization_id: organizationId,
        product_id: productId,
        storage_path: storagePath,
        original_filename: fileValue.name,
        mime_type: fileValue.type,
        size_bytes: fileValue.size,
        alt_text: altText || null,
      });

    if (metadataError) {
      await supabase.storage
        .from("product-images")
        .remove([storagePath]);

      setErrorMessage(metadataError.message);
      setIsUploading(false);
      return;
    }

    form.reset();

    setSuccessMessage("Product image berhasil di-upload.");
    setIsUploading(false);

    router.refresh();
  }

  async function handleSetPrimary(imageId: string) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setBusyImageId(imageId);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "set_primary_product_image",
      {
        p_organization_id: organizationId,
        p_product_id: productId,
        p_image_id: imageId,
      },
    );

    if (error) {
      setErrorMessage(error.message);
      setBusyImageId(null);
      return;
    }

    setSuccessMessage("Primary image berhasil diperbarui.");
    setBusyImageId(null);

    router.refresh();
  }

  async function handleMove(
    imageId: string,
    direction: "up" | "down",
  ) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setBusyImageId(imageId);

    const currentIndex = images.findIndex(
      (image) => image.id === imageId,
    );

    if (currentIndex === -1) {
      setErrorMessage("Image tidak ditemukan.");
      setBusyImageId(null);
      return;
    }

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= images.length
    ) {
      setBusyImageId(null);
      return;
    }

    const reorderedIds = images.map((image) => image.id);

    [
      reorderedIds[currentIndex],
      reorderedIds[targetIndex],
    ] = [
      reorderedIds[targetIndex],
      reorderedIds[currentIndex],
    ];

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "reorder_product_images",
      {
        p_organization_id: organizationId,
        p_product_id: productId,
        p_image_ids: reorderedIds,
      },
    );

    if (error) {
      setErrorMessage(error.message);
      setBusyImageId(null);
      return;
    }

    setSuccessMessage("Urutan image berhasil diperbarui.");
    setBusyImageId(null);

    router.refresh();
  }

  async function handleDelete(image: ProductImage) {
    const confirmed = window.confirm(
      `Hapus image "${image.original_filename}"?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setBusyImageId(image.id);

    const supabase = createClient();

    const { error: storageError } = await supabase.storage
      .from("product-images")
      .remove([image.storage_path]);

    if (storageError) {
      setErrorMessage(storageError.message);
      setBusyImageId(null);
      return;
    }

    const { error: metadataError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", image.id)
      .eq("organization_id", organizationId)
      .eq("product_id", productId);

    if (metadataError) {
      setErrorMessage(
        `Storage file terhapus, tetapi metadata gagal dihapus: ${metadataError.message}`,
      );
      setBusyImageId(null);
      router.refresh();
      return;
    }

    setSuccessMessage("Product image berhasil dihapus.");
    setBusyImageId(null);

    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <form
          onSubmit={handleUpload}
          className="space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold">
              Upload Product Image
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Upload image untuk {productName}. Maksimal 5 MB.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="image"
              className="text-sm font-medium"
            >
              Image file
            </label>

            <Input
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="alt_text"
              className="text-sm font-medium"
            >
              Alt text
            </label>

            <Input
              id="alt_text"
              name="alt_text"
              placeholder="Deskripsi singkat gambar"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border px-4 py-3 text-sm">
              {successMessage}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload image"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Product Images
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Kelola primary image dan urutan tampilan product.
          </p>
        </div>

        {images.length === 0 ? (
          <div className="rounded-2xl border bg-card px-6 py-12 text-center shadow-sm">
            <p className="font-medium">
              Belum ada product image
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Upload image pertama untuk membuat primary image.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <div className="aspect-square bg-muted">
                  {image.signed_url ? (
                    <img
                      src={image.signed_url}
                      alt={
                        image.alt_text ??
                        image.original_filename
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                      Preview tidak tersedia
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate font-medium">
                        {image.original_filename}
                      </p>

                      {image.is_primary ? (
                        <span className="shrink-0 rounded-full border px-2 py-1 text-xs font-medium">
                          Primary
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>{image.mime_type}</p>
                      <p>{formatFileSize(image.size_bytes)}</p>
                      <p>Position {index + 1}</p>
                    </div>

                    {image.alt_text ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {image.alt_text}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    {!image.is_primary ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyImageId !== null}
                        onClick={() =>
                          handleSetPrimary(image.id)
                        }
                      >
                        Set primary
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        busyImageId !== null ||
                        index === 0
                      }
                      onClick={() =>
                        handleMove(image.id, "up")
                      }
                    >
                      Up
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        busyImageId !== null ||
                        index === images.length - 1
                      }
                      onClick={() =>
                        handleMove(image.id, "down")
                      }
                    >
                      Down
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busyImageId !== null}
                      onClick={() =>
                        handleDelete(image)
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}