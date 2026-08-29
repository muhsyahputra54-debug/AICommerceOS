"use client";

import {
  useState,
} from "react";

import {
  assessTikTokCreatorPreparation,
  parseTikTokCreatorInfoApiResponse,
} from "@/lib/ai/tiktok-creator-direct-post-ui";

import type {
  TikTokCreatorInfoSnapshot,
  TikTokPrivacyLevel,
} from "@/lib/ai/tiktok-creator-publishing";

import {
  planTikTokVideoFileUpload,
  type TikTokVideoUploadPlan,
} from "@/lib/ai/tiktok-creator-video-upload";

import type {
  Locale,
} from "@/lib/i18n/config";

const CREATOR_INFO_API =
  "/api/ai/publishing-provider-connections/tiktok/creator-info";

type LoadState =
  | "idle"
  | "loading"
  | "ready"
  | "error";

function privacyLabel(
  value: TikTokPrivacyLevel,
  isId: boolean,
): string {
  switch (value) {
    case "PUBLIC_TO_EVERYONE":
      return isId
        ? "Publik"
        : "Public";

    case "FOLLOWER_OF_CREATOR":
      return isId
        ? "Pengikut"
        : "Followers";

    case "MUTUAL_FOLLOW_FRIENDS":
      return isId
        ? "Teman yang saling mengikuti"
        : "Mutual follow friends";

    case "SELF_ONLY":
      return isId
        ? "Hanya saya"
        : "Only me";
  }
}

type SelectedVideo = Readonly<{
  file: File;
  durationSec: number;
  uploadPlan: TikTokVideoUploadPlan;
}>;

async function readVideoDurationSec(
  file: File,
): Promise<number> {
  const url =
    URL.createObjectURL(file);

  try {
    return await new Promise<number>(
      (resolve, reject) => {
        const video =
          document.createElement(
            "video",
          );

        video.preload =
          "metadata";

        video.onloadedmetadata =
          () => {
            if (
              Number.isFinite(video.duration) &&
              video.duration > 0
            ) {
              resolve(video.duration);
            }
            else {
              reject(
                new Error(
                  "invalid duration",
                ),
              );
            }
          };

        video.onerror =
          () => {
            reject(
              new Error(
                "metadata read failed",
              ),
            );
          };

        video.src =
          url;
      },
    );
  }
  finally {
    URL.revokeObjectURL(url);
  }
}

export default function TikTokCreatorDirectPostPanel({
  locale,
}: Readonly<{
  locale: Locale;
}>) {
  const isId =
    locale ===
    "id";

  const [
    loadState,
    setLoadState,
  ] =
    useState<LoadState>(
      "idle",
    );

  const [
    creatorInfo,
    setCreatorInfo,
  ] =
    useState<TikTokCreatorInfoSnapshot | null>(
      null,
    );

  const [
    title,
    setTitle,
  ] =
    useState(
      "",
    );

  const [
    selectedVideo,
    setSelectedVideo,
  ] =
    useState<SelectedVideo | null>(
      null,
    );

  const [
    videoStatus,
    setVideoStatus,
  ] =
    useState<
      | "idle"
      | "reading"
      | "ready"
      | "error"
    >(
      "idle",
    );

  const [
    selectedPrivacy,
    setSelectedPrivacy,
  ] =
    useState<TikTokPrivacyLevel | "">(
      "",
    );

  const [
    allowComment,
    setAllowComment,
  ] =
    useState(
      false,
    );

  const [
    allowDuet,
    setAllowDuet,
  ] =
    useState(
      false,
    );

  const [
    allowStitch,
    setAllowStitch,
  ] =
    useState(
      false,
    );

  const [
    commercialDisclosureEnabled,
    setCommercialDisclosureEnabled,
  ] =
    useState(
      false,
    );

  const [
    ownBrand,
    setOwnBrand,
  ] =
    useState(
      false,
    );

  const [
    brandedContent,
    setBrandedContent,
  ] =
    useState(
      false,
    );

  const [
    explicitUserConsent,
    setExplicitUserConsent,
  ] =
    useState(
      false,
    );

  const [
    preparationAccepted,
    setPreparationAccepted,
  ] =
    useState(
      false,
    );

  const copy =
    isId
      ? {
          eyebrow:
            "DIRECT POST",
          title:
            "Persiapan publikasi TikTok",
          description:
            "Muat informasi kreator terbaru dari TikTok, tinjau pengaturan publikasi, lalu berikan persetujuan sebelum tahap unggah video.",
          prepare:
            "Siapkan Direct Post",
          refresh:
            "Perbarui info kreator",
          loading:
            "Memuat informasi kreator...",
          error:
            "Persiapan Direct Post belum dapat dimuat. Pastikan koneksi TikTok masih aktif.",
          account:
            "Akun tujuan",
          checkedAt:
            "Info kreator diperbarui",
          video:
            "Video TikTok",
          videoHelp:
            "Pilih MP4, MOV, atau WebM. File belum dikirim ke TikTok pada tahap ini.",
          videoReading:
            "Membaca metadata video...",
          videoError:
            "Video tidak memenuhi format, ukuran, metadata, atau batas durasi TikTok.",
          videoReady:
            "Video siap untuk tahap inisialisasi.",
          caption:
            "Caption / judul TikTok",
          captionPlaceholder:
            "Tulis caption, hashtag, atau mention...",
          privacy:
            "Siapa yang dapat melihat",
          privacyPlaceholder:
            "Pilih privasi",
          interactions:
            "Interaksi",
          allowComment:
            "Izinkan komentar",
          allowDuet:
            "Izinkan Duet",
          allowStitch:
            "Izinkan Stitch",
          disabledByTikTok:
            "Dinonaktifkan oleh pengaturan akun TikTok",
          commercial:
            "Konten komersial",
          commercialHelp:
            "Aktifkan jika konten mempromosikan diri Anda, bisnis, brand, produk, atau layanan.",
          ownBrand:
            "Brand / bisnis saya",
          brandedContent:
            "Brand pihak ketiga",
          promotional:
            "Video akan diberi label sebagai Promotional content.",
          consent:
            "By posting, you agree to TikTok's Music Usage Confirmation",
          continue:
            "Lanjutkan ke tahap unggah video",
          prepared:
            "Persiapan siap. Belum ada video yang diunggah atau dipublikasikan.",
          incomplete:
            "Pilih video, privasi, dan berikan persetujuan sebelum melanjutkan.",
          maxDuration:
            "Durasi video maksimum",
        }
      : {
          eyebrow:
            "DIRECT POST",
          title:
            "TikTok publishing preparation",
          description:
            "Load the latest creator information from TikTok, review publishing settings, and provide consent before the video-upload step.",
          prepare:
            "Prepare Direct Post",
          refresh:
            "Refresh creator info",
          loading:
            "Loading creator information...",
          error:
            "Direct Post preparation could not be loaded. Make sure the TikTok connection is still active.",
          account:
            "Target account",
          checkedAt:
            "Creator info refreshed",
          video:
            "TikTok video",
          videoHelp:
            "Choose MP4, MOV, or WebM. The file is not sent to TikTok at this stage.",
          videoReading:
            "Reading video metadata...",
          videoError:
            "The video does not meet TikTok format, size, metadata, or duration limits.",
          videoReady:
            "Video is ready for the initialization step.",
          caption:
            "TikTok caption / title",
          captionPlaceholder:
            "Write a caption, hashtags, or mentions...",
          privacy:
            "Who can view this post",
          privacyPlaceholder:
            "Select privacy",
          interactions:
            "Interactions",
          allowComment:
            "Allow comments",
          allowDuet:
            "Allow Duet",
          allowStitch:
            "Allow Stitch",
          disabledByTikTok:
            "Disabled by the TikTok account settings",
          commercial:
            "Commercial content",
          commercialHelp:
            "Enable this if the content promotes you, a business, brand, product, or service.",
          ownBrand:
            "My brand / business",
          brandedContent:
            "Third-party brand",
          promotional:
            "The video will be labeled as Promotional content.",
          consent:
            "By posting, you agree to TikTok's Music Usage Confirmation",
          continue:
            "Continue to video upload",
          prepared:
            "Preparation is ready. No video has been uploaded or published.",
          incomplete:
            "Choose a video and privacy setting, then provide consent before continuing.",
          maxDuration:
            "Maximum video duration",
        };

  async function loadCreatorInfo() {
    setLoadState(
      "loading",
    );

    setPreparationAccepted(
      false,
    );

    try {
      const response =
        await fetch(
          CREATOR_INFO_API,
          {
            method:
              "GET",
            cache:
              "no-store",
            credentials:
              "same-origin",
            headers: {
              Accept:
                "application/json",
            },
          },
        );

      if (!response.ok) {
        throw new Error(
          "Creator Info request failed.",
        );
      }

      const body:
        unknown =
          await response.json();

      const parsed =
        parseTikTokCreatorInfoApiResponse(
          body,
        );

      if (!parsed.ok) {
        throw new Error(
          "Creator Info response invalid.",
        );
      }

      setCreatorInfo(
        parsed.value,
      );
      setSelectedVideo(
        null,
      );
      setVideoStatus(
        "idle",
      );

      // TikTok UX requirements: no privacy or interaction defaults.
      setSelectedPrivacy(
        "",
      );
      setAllowComment(
        false,
      );
      setAllowDuet(
        false,
      );
      setAllowStitch(
        false,
      );
      setCommercialDisclosureEnabled(
        false,
      );
      setOwnBrand(
        false,
      );
      setBrandedContent(
        false,
      );
      setExplicitUserConsent(
        false,
      );

      setLoadState(
        "ready",
      );
    } catch {
      setCreatorInfo(
        null,
      );
      setLoadState(
        "error",
      );
    }
  }

  async function selectVideo(
    file: File,
  ) {
    setPreparationAccepted(false);
    setExplicitUserConsent(false);
    setSelectedVideo(null);
    setVideoStatus("reading");

    const plan =
      planTikTokVideoFileUpload({
        videoSize:
          file.size,
        mimeType:
          file.type,
        fileName:
          file.name,
      });

    if (!plan.ok) {
      setVideoStatus("error");
      return;
    }

    try {
      const durationSec =
        await readVideoDurationSec(file);

      if (
        !creatorInfo ||
        durationSec >
          creatorInfo.maxVideoPostDurationSec
      ) {
        setVideoStatus("error");
        return;
      }

      setSelectedVideo({
        file,
        durationSec,
        uploadPlan:
          plan.value,
      });
      setVideoStatus("ready");
    }
    catch {
      setVideoStatus("error");
    }
  }

  const preparation =
    creatorInfo
      ? assessTikTokCreatorPreparation(
          {
            snapshot:
              creatorInfo,
            selectedPrivacyLevel:
              selectedPrivacy,
            allowComment,
            allowDuet,
            allowStitch,
            commercialDisclosureEnabled,
            ownBrand,
            brandedContent,
            explicitUserConsent,
          },
        )
      : null;

  const canContinue =
    preparation?.ready ===
      true &&
    selectedVideo !==
      null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-[0.18em] text-sky-600">
          {copy.eyebrow}
        </p>

        <h3 className="text-lg font-semibold text-slate-950">
          {copy.title}
        </h3>

        <p className="text-sm leading-6 text-slate-600">
          {copy.description}
        </p>
      </div>

      {loadState === "idle" ? (
        <button
          type="button"
          onClick={() => {
            void loadCreatorInfo();
          }}
          className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
        >
          {copy.prepare}
        </button>
      ) : null}

      {loadState === "loading" ? (
        <p className="mt-5 text-sm text-slate-600">
          {copy.loading}
        </p>
      ) : null}

      {loadState === "error" ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-rose-700">
            {copy.error}
          </p>

          <button
            type="button"
            onClick={() => {
              void loadCreatorInfo();
            }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            {copy.prepare}
          </button>
        </div>
      ) : null}

      {loadState === "ready" && creatorInfo ? (
        <div className="mt-5 space-y-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {copy.account}
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {creatorInfo.creatorNickname}
                </p>
                <p className="text-sm text-slate-600">
                  @{creatorInfo.creatorUsername}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  void loadCreatorInfo();
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                {copy.refresh}
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              {copy.checkedAt}:{" "}
              {new Date(
                creatorInfo.checkedAt,
              ).toLocaleString()}
              {" | "}
              {copy.maxDuration}:{" "}
              {creatorInfo.maxVideoPostDurationSec}s
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              {copy.video}
            </label>

            <input
              type="file"
              accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
              onChange={(event) => {
                const file =
                  event.target.files?.[0];

                if (!file) {
                  setSelectedVideo(null);
                  setVideoStatus("idle");
                  setExplicitUserConsent(false);
                  setPreparationAccepted(false);
                  return;
                }

                void selectVideo(file);
              }}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />

            <p className="text-xs leading-5 text-slate-500">
              {copy.videoHelp}
            </p>

            {videoStatus === "reading" ? (
              <p className="text-xs font-medium text-sky-700">
                {copy.videoReading}
              </p>
            ) : null}

            {videoStatus === "error" ? (
              <p className="text-xs font-medium text-rose-700">
                {copy.videoError}
              </p>
            ) : null}

            {videoStatus === "ready" && selectedVideo ? (
              <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <p className="font-semibold text-slate-800">
                  {selectedVideo.file.name}
                </p>
                <p>
                  {(selectedVideo.file.size / 1_000_000).toFixed(2)} MB
                  {" | "}
                  {selectedVideo.durationSec.toFixed(1)}s
                  {" | "}
                  {selectedVideo.uploadPlan.totalChunkCount} chunk(s)
                </p>
                <p className="text-emerald-700">
                  {copy.videoReady}
                </p>
              </div>
            ) : null}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">
              {copy.caption}
            </span>
            <textarea
              value={title}
              onChange={(event) => {
                setTitle(
                  event.target.value,
                );
                setPreparationAccepted(
                  false,
                );
              }}
              maxLength={2200}
              rows={4}
              placeholder={copy.captionPlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-sky-500"
            />
            <span className="text-xs text-slate-500">
              {title.length}/2200
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">
              {copy.privacy}
            </span>

            <select
              value={selectedPrivacy}
              onChange={(event) => {
                setSelectedPrivacy(
                  event.target.value as
                    | TikTokPrivacyLevel
                    | "",
                );
                setPreparationAccepted(
                  false,
                );
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            >
              <option value="">
                {copy.privacyPlaceholder}
              </option>

              {creatorInfo.privacyLevelOptions.map(
                (privacy) => (
                  <option
                    key={privacy}
                    value={privacy}
                  >
                    {privacyLabel(
                      privacy,
                      isId,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-800">
              {copy.interactions}
            </legend>

            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={allowComment}
                disabled={creatorInfo.commentDisabled}
                onChange={(event) => {
                  setAllowComment(
                    event.target.checked,
                  );
                  setPreparationAccepted(
                    false,
                  );
                }}
                className="mt-1"
              />
              <span>
                {copy.allowComment}
                {creatorInfo.commentDisabled ? (
                  <span className="ml-2 text-xs text-slate-500">
                    ({copy.disabledByTikTok})
                  </span>
                ) : null}
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={allowDuet}
                disabled={creatorInfo.duetDisabled}
                onChange={(event) => {
                  setAllowDuet(
                    event.target.checked,
                  );
                  setPreparationAccepted(
                    false,
                  );
                }}
                className="mt-1"
              />
              <span>
                {copy.allowDuet}
                {creatorInfo.duetDisabled ? (
                  <span className="ml-2 text-xs text-slate-500">
                    ({copy.disabledByTikTok})
                  </span>
                ) : null}
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={allowStitch}
                disabled={creatorInfo.stitchDisabled}
                onChange={(event) => {
                  setAllowStitch(
                    event.target.checked,
                  );
                  setPreparationAccepted(
                    false,
                  );
                }}
                className="mt-1"
              />
              <span>
                {copy.allowStitch}
                {creatorInfo.stitchDisabled ? (
                  <span className="ml-2 text-xs text-slate-500">
                    ({copy.disabledByTikTok})
                  </span>
                ) : null}
              </span>
            </label>
          </fieldset>

          <div className="rounded-xl border border-slate-200 p-4">
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={commercialDisclosureEnabled}
                onChange={(event) => {
                  const checked =
                    event.target.checked;

                  setCommercialDisclosureEnabled(
                    checked,
                  );

                  if (!checked) {
                    setOwnBrand(
                      false,
                    );
                    setBrandedContent(
                      false,
                    );
                  }

                  setPreparationAccepted(
                    false,
                  );
                }}
                className="mt-1"
              />
              <span>
                {copy.commercial}
              </span>
            </label>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {copy.commercialHelp}
            </p>

            {commercialDisclosureEnabled ? (
              <div className="mt-3 space-y-3 pl-6">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={ownBrand}
                    onChange={(event) => {
                      setOwnBrand(
                        event.target.checked,
                      );
                      setPreparationAccepted(
                        false,
                      );
                    }}
                    className="mt-1"
                  />
                  <span>
                    {copy.ownBrand}
                  </span>
                </label>

                {ownBrand ? (
                  <p className="text-xs text-slate-500">
                    {copy.promotional}
                  </p>
                ) : null}

                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={brandedContent}
                    onChange={(event) => {
                      setBrandedContent(
                        event.target.checked,
                      );
                      setPreparationAccepted(
                        false,
                      );
                    }}
                    className="mt-1"
                  />
                  <span>
                    {copy.brandedContent}
                  </span>
                </label>
              </div>
            ) : null}
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-sky-50 p-4 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={explicitUserConsent}
              onChange={(event) => {
                setExplicitUserConsent(
                  event.target.checked,
                );
                setPreparationAccepted(
                  false,
                );
              }}
              className="mt-1"
            />
            <span>
              {copy.consent}
            </span>
          </label>

          <button
            type="button"
            disabled={!canContinue || preparationAccepted}
            onClick={() => {
              if (canContinue) {
                setPreparationAccepted(
                  true,
                );
              }
            }}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {preparationAccepted ? (isId ? "Persiapan siap" : "Preparation ready") : copy.continue}
          </button>

          <div
              role="status"
              aria-live="polite"
              className={
                preparationAccepted
                  ? "rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"
                  : "text-xs leading-5 text-slate-500"
              }
            >
              {preparationAccepted
                ? copy.prepared
                : copy.incomplete}
            </div>
        </div>
      ) : null}
    </section>
  );
}