"use client";

/* ================================================================== */
/*  FROSTDEW — Products tab backup & restore (JSON export / import)    */
/*                                                                     */
/*  Export downloads { exportedAt, version, products, videos }         */
/*  pretty-printed as "frostdew-products-backup.json" — every product   */
/*  carries its per-store "links" object (all four stores). Import      */
/*  accepts the same shape (wrapper object or a bare array), validates  */
/*  every item, previews a summary (incl. how many products have 3 / 2  */
/*  links), and writes through the same store (frostdew_store_data)    */
/*  so the public site and the admin stay in sync. Old backups whose   */
/*  products only have "url" are accepted too — the store is           */
/*  auto-detected and "links" filled in without marking them invalid.  */
/* ================================================================== */

import { useMemo, useState, type ChangeEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, FileJson, X } from "lucide-react";
import {
  type PlaceholderArt,
  type Product,
  type ProductLinks,
  type ProductStatus,
  type VideoLink,
} from "@/config/store";
import { detectStoreKey, getStoreLinkEntries, slugify } from "@/lib/store";
import { Field, inputClass } from "./fields";

export const BACKUP_FILENAME = "frostdew-products-backup.json";
export const BACKUP_VERSION = 4;

type ImportMode = "replace" | "merge";

const ART_VALUES: PlaceholderArt[] = ["bottle", "pump", "jar", "tube", "dropper", "pot"];

/* ------------------------------ export ---------------------------- */

export function exportProductsToJson(products: Product[], videos: VideoLink[]): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: BACKUP_VERSION,
    products,
    videos,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = BACKUP_FILENAME;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a moment to start the download, then free the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* --------------------------- links parsing ------------------------- */

/** Accepts the new "links" object (all values optional/coerced).
 *  Returns null when the item has no links object at all. */
function normalizeImportedLinks(raw: unknown): ProductLinks | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  return {
    amazonUs: asString(source.amazonUs).trim(),
    amazonUk: asString(source.amazonUk).trim(),
    stylevana: asString(source.stylevana).trim(),
    oliveYoung: asString(source.oliveYoung).trim(),
  };
}

/** Legacy shape — the product only has "url": auto-detect the store and
 *  fill "links" without ever touching "url" itself. */
function linksFromLegacyUrl(url: string): ProductLinks {
  const key = detectStoreKey(url);
  const links: ProductLinks = { amazonUs: "", amazonUk: "", stylevana: "", oliveYoung: "" };
  if (key) links[key] = url;
  return links;
}

/* --------------------------- normalization ------------------------ */

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

type NormalizedProduct =
  | { ok: true; product: Product }
  | { ok: false; reason: string };

type NormalizedVideo =
  | { ok: true; video: VideoLink }
  | { ok: false; reason: string };

/** Coerce one imported item into the exact Product shape the store uses. */
function normalizeImportedProduct(raw: unknown, index: number): NormalizedProduct {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "Not a product object" };
  }
  const source = raw as Record<string, unknown>;

  if (source.name === undefined || source.name === null || asString(source.name).trim() === "") {
    return { ok: false, reason: 'Missing a "name" (required)' };
  }
  const name = asString(source.name).trim();

  // Price is OPTIONAL — a product without one is always valid and never
  // flagged invalid (affiliate policy: prices are never displayed).
  const priceRaw =
    source.price === null || source.price === undefined || source.price === ""
      ? NaN
      : Number(source.price);
  const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : undefined;

  const artCandidate = asString(source.art) as PlaceholderArt;
  const art = ART_VALUES.includes(artCandidate) ? artCandidate : "bottle";
  const status: ProductStatus = asString(source.status) === "draft" ? "draft" : "active";
  const id =
    asString(source.id).trim() ||
    `${slugify(name) || "product"}-${Date.now().toString(36)}-${index}`;

  const url = asString(source.url).trim();
  // New shape (with "links") and legacy shape (only "url") both land on
  // the same canonical Product — links issues never invalidate a product.
  const links = normalizeImportedLinks(source.links) ?? linksFromLegacyUrl(url);

  // Optional catalog metadata (kept when the file provides valid values).
  const ratingRaw = Number(source.rating);
  const rating = Number.isFinite(ratingRaw) && ratingRaw > 0 ? ratingRaw : undefined;
  const reviewsRaw = Number(source.reviewCount);
  const reviewCount =
    Number.isFinite(reviewsRaw) && reviewsRaw >= 0 ? Math.round(reviewsRaw) : undefined;

  // Optional display-only price metadata — pass-through so backups
  // round-trip them; absent/invalid values never invalidate a product.
  const compareAtRaw = Number(source.compareAtPrice);
  const compareAtPrice =
    source.compareAtPrice === null ||
    source.compareAtPrice === undefined ||
    source.compareAtPrice === ""
      ? undefined
      : Number.isFinite(compareAtRaw) && compareAtRaw >= 0
        ? compareAtRaw
        : undefined;
  // "priceCheckedDate" ("YYYY-MM-DD") is the canonical key; the older
  // "priceCheckedAt" spelling from early backups is still accepted.
  const checkedRaw =
    asString(source.priceCheckedDate).trim() || asString(source.priceCheckedAt).trim();
  const priceCheckedDate = checkedRaw === "" ? undefined : checkedRaw;

  return {
    ok: true,
    product: {
      id,
      name,
      price,
      compareAtPrice,
      priceCheckedDate,
      currency: asString(source.currency).trim().toUpperCase().slice(0, 3) || "USD",
      categories: asStringArray(source.categories),
      shortDescription: asString(source.shortDescription),
      fullDescription: asString(source.fullDescription),
      image: asString(source.image).trim(),
      gallery: asStringArray(source.gallery)
        .map((g) => g.trim())
        .filter(Boolean),
      url,
      links,
      badge: asString(source.badge).trim() || undefined,
      available: source.available === undefined ? true : source.available !== false,
      size: asString(source.size).trim() || undefined,
      features: asStringArray(source.features),
      buttonLabel: asString(source.buttonLabel).trim() || "Get it Now",
      status,
      art,
      rating,
      reviewCount,
    },
  };
}

/* --------------------------- video parsing ------------------------ */

/** Coerce one imported video row into the exact VideoLink shape the store uses. */
function normalizeImportedVideo(raw: unknown, index: number): NormalizedVideo {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "Not a video object" };
  }
  const source = raw as Record<string, unknown>;
  return {
    ok: true,
    video: {
      id: asString(source.id).trim() || `video-import-${Date.now().toString(36)}-${index}`,
      title: asString(source.title),
      url: asString(source.url).trim(),
      thumbnail: asString(source.thumbnail).trim(),
    },
  };
}

/** Merge imported videos into the existing list: update by id, keep
 *  existing rows that are not in the file, append new ones in file order. */
function mergeVideoLists(existing: VideoLink[], incoming: VideoLink[]): VideoLink[] {
  const byId = new Map(existing.map((v) => [v.id, v]));
  for (const video of incoming) byId.set(video.id, video);
  return Array.from(byId.values());
}

/* ------------------------------ parsing --------------------------- */

export type ImportItemStatus = "add" | "update" | "skip" | "invalid";

export interface ImportItem {
  index: number;
  status: ImportItemStatus;
  product?: Product;
  reason?: string;
}

export interface ImportLinkCounts {
  three: number;
  two: number;
  one: number;
  zero: number;
}

export interface ImportAnalysis {
  fatal?: string;
  items: ImportItem[];
  products: Product[];
  added: number;
  updated: number;
  skipped: number;
  invalid: number;
  /** How many of the imported products have 3 / 2 / 1 / 0 store links. */
  linkCounts: ImportLinkCounts;
  /** True when the file contained a "videos" array (older backups may not). */
  hasVideosFile: boolean;
  videos: VideoLink[];
  videoInvalid: number;
  videoAdded: number;
  videoUpdated: number;
}

const EMPTY_ANALYSIS: ImportAnalysis = {
  items: [],
  products: [],
  added: 0,
  updated: 0,
  skipped: 0,
  invalid: 0,
  linkCounts: { three: 0, two: 0, one: 0, zero: 0 },
  hasVideosFile: false,
  videos: [],
  videoInvalid: 0,
  videoAdded: 0,
  videoUpdated: 0,
};

export function analyzeImport(
  text: string,
  existingIds: ReadonlySet<string>,
  mode: ImportMode,
  existingVideoIds: ReadonlySet<string> = new Set(),
): ImportAnalysis {
  const trimmed = text.trim();
  if (trimmed === "") return EMPTY_ANALYSIS;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    return { ...EMPTY_ANALYSIS, fatal: `This is not valid JSON — ${(error as Error).message}.` };
  }

  const isWrapper = !Array.isArray(parsed) && typeof parsed === "object" && parsed !== null;
  const wrapper = isWrapper ? (parsed as Record<string, unknown>) : null;

  const list = Array.isArray(parsed)
    ? parsed
    : wrapper && Array.isArray(wrapper.products)
      ? (wrapper.products as unknown[])
      : null;

  if (!list) {
    return {
      ...EMPTY_ANALYSIS,
      fatal: 'Expected an array of products or an object with a "products" array.',
    };
  }

  /* Videos (optional, only honoured when the file actually has the key —
   * older backups without it leave the stored video list untouched). */
  const rawVideos = wrapper && Array.isArray(wrapper.videos) ? (wrapper.videos as unknown[]) : null;
  const hasVideosFile = rawVideos !== null;
  const videos: VideoLink[] = [];
  let videoInvalid = 0;
  let videoAdded = 0;
  let videoUpdated = 0;
  if (rawVideos) {
    const seenVideoIds = new Set<string>();
    rawVideos.forEach((raw, index) => {
      const result = normalizeImportedVideo(raw, index);
      if (!result.ok) {
        videoInvalid += 1;
        return;
      }
      const video = result.video;
      if (seenVideoIds.has(video.id)) return; // duplicate id inside the file — keep the first
      seenVideoIds.add(video.id);
      videos.push(video);
      if (mode === "merge" && existingVideoIds.has(video.id)) videoUpdated += 1;
      else videoAdded += 1;
    });
  }

  const items: ImportItem[] = [];
  const products: Product[] = [];
  const seenIds = new Set<string>();
  const linkCounts: ImportLinkCounts = { three: 0, two: 0, one: 0, zero: 0 };
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let invalid = 0;

  list.forEach((raw, index) => {
    const result = normalizeImportedProduct(raw, index);
    if (!result.ok) {
      invalid += 1;
      items.push({ index, status: "invalid", reason: result.reason });
      return;
    }
    const product = result.product;
    if (seenIds.has(product.id)) {
      skipped += 1;
      items.push({
        index,
        status: "skip",
        reason: `Duplicate id "${product.id}" inside the file — only the first occurrence is kept.`,
      });
      return;
    }
    seenIds.add(product.id);
    if (mode === "merge" && existingIds.has(product.id)) {
      updated += 1;
      items.push({ index, status: "update", product });
    } else {
      added += 1;
      items.push({ index, status: "add", product });
    }
    products.push(product);
    // Summary: how many products have 3 / 2 / 1 store links.
    const linkTotal = getStoreLinkEntries(product).length;
    if (linkTotal >= 3) linkCounts.three += 1;
    else if (linkTotal === 2) linkCounts.two += 1;
    else if (linkTotal === 1) linkCounts.one += 1;
    else linkCounts.zero += 1;
  });

  return {
    items,
    products,
    added,
    updated,
    skipped,
    invalid,
    linkCounts,
    hasVideosFile,
    videos,
    videoInvalid,
    videoAdded,
    videoUpdated,
  };
}

/* ------------------------------ dialog ---------------------------- */

function CountChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-2.5 text-center">
      <p className={`font-display text-xl ${tone === "danger" ? "text-destructive" : "text-winter"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ModeOption({
  active,
  title,
  description,
  onSelect,
}: {
  active: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
        active ? "border-glacier bg-glacier/15 shadow-sm" : "border-winter/15 bg-white/50 hover:border-frost"
      }`}
    >
      <span className="flex items-center gap-2.5 text-sm font-bold text-midnight">
        <span
          aria-hidden="true"
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
            active ? "border-glacier bg-glacier" : "border-winter/40 bg-white"
          }`}
        >
          {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        {title}
      </span>
      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>
    </button>
  );
}

export default function ImportDialog({
  open,
  onOpenChange,
  products,
  videos,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  videos: VideoLink[];
  onApply: (
    nextProducts: Product[],
    importedProducts: number,
    nextVideos: VideoLink[] | null,
    importedVideos: number,
  ) => void;
}) {
  const [rawText, setRawText] = useState("");
  const [mode, setMode] = useState<ImportMode>("merge");
  const [fileName, setFileName] = useState("");

  const existingIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  const existingVideoIds = useMemo(() => new Set(videos.map((v) => v.id)), [videos]);
  const analysis = useMemo(
    () => (open ? analyzeImport(rawText, existingIds, mode, existingVideoIds) : EMPTY_ANALYSIS),
    [open, rawText, existingIds, mode, existingVideoIds],
  );

  const canApply = !analysis.fatal && analysis.products.length > 0;

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again later
    if (!file) return;
    setFileName(file.name);
    file
      .text()
      .then((text) => setRawText(text))
      .catch(() => setFileName(""));
  };

  const apply = () => {
    if (!canApply) return;
    let next: Product[];
    if (mode === "replace") {
      next = analysis.products;
    } else {
      const byId = new Map(products.map((p) => [p.id, p]));
      for (const product of analysis.products) byId.set(product.id, product);
      next = Array.from(byId.values());
    }
    const importedCount =
      mode === "replace" ? analysis.products.length : analysis.added + analysis.updated;
    // Videos ride along only when the file actually contains them.
    const nextVideos = analysis.hasVideosFile
      ? mode === "replace"
        ? analysis.videos
        : mergeVideoLists(videos, analysis.videos)
      : null;
    const importedVideos = analysis.hasVideosFile
      ? mode === "replace"
        ? analysis.videos.length
        : analysis.videoAdded + analysis.videoUpdated
      : 0;
    onApply(next, importedCount, nextVideos, importedVideos);
    setRawText("");
    setFileName("");
  };

  const hasPreview = !analysis.fatal && rawText.trim() !== "";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-midnight/30 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="glass-deep thin-scroll fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.75rem] p-6 focus:outline-none sm:p-8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300">
          <DialogPrimitive.Title className="font-display text-2xl font-medium text-midnight">
            Import products
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
            Paste a FrostDew backup or choose a .json file. Nothing changes until you press
            Import.
          </DialogPrimitive.Description>
          <DialogPrimitive.Close
            aria-label="Close import dialog"
            className="glass-chip absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-winter"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogPrimitive.Close>

          <div className="mt-6">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-winter">
              Import mode
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <ModeOption
                active={mode === "merge"}
                title="Merge"
                description="Update existing products by id, keep existing ones not in the file."
                onSelect={() => setMode("merge")}
              />
              <ModeOption
                active={mode === "replace"}
                title="Replace all"
                description="Wipe the current catalog and replace it with the imported products."
                onSelect={() => setMode("replace")}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="glass-chip flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-winter transition-all duration-300 hover:-translate-y-0.5">
              <FileJson className="h-4 w-4" aria-hidden="true" />
              Choose file
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFile}
                className="sr-only"
              />
            </label>
            {fileName && (
              <span className="text-xs font-semibold text-muted-foreground">
                {fileName} loaded — review the JSON below.
              </span>
            )}
          </div>

          <div className="mt-4">
            <Field label="JSON" htmlFor="import-json">
              <textarea
                id="import-json"
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={'[ { "name": "Winter Serum", "price": 19 } ]  or  { "products": [ … ] }'}
                spellCheck={false}
                className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
              />
            </Field>
          </div>

          {analysis.fatal && (
            <p
              role="alert"
              className="mt-1 flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{analysis.fatal} Nothing was changed.</span>
            </p>
          )}

          {hasPreview && (
            <div className="mt-4 rounded-2xl border border-winter/10 bg-white/60 p-4" role="status">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <CountChip
                  label={mode === "replace" ? "Replaces catalog" : "Will be added"}
                  value={mode === "replace" ? analysis.products.length : analysis.added}
                />
                <CountChip label="Will be updated" value={analysis.updated} />
                <CountChip label="Skipped" value={analysis.skipped} />
                <CountChip
                  label="Invalid"
                  value={analysis.invalid}
                  tone={analysis.invalid > 0 ? "danger" : "default"}
                />
              </div>
              {analysis.products.length === 0 && (
                <p className="mt-3 border-t border-winter/10 pt-3 text-xs font-semibold text-muted-foreground">
                  No products found in this JSON yet.
                </p>
              )}
              {analysis.products.length > 0 && (
                <p className="mt-3 border-t border-winter/10 pt-3 text-xs font-semibold text-muted-foreground">
                  Store links: {analysis.linkCounts.three} product
                  {analysis.linkCounts.three === 1 ? "" : "s"} with 3 or 4 ·{" "}
                  {analysis.linkCounts.two} with 2 · {analysis.linkCounts.one} with 1
                  {analysis.linkCounts.zero > 0
                    ? ` · ${analysis.linkCounts.zero} with none`
                    : ""}
                  .
                </p>
              )}
              {analysis.hasVideosFile && (
                <p className="mt-3 border-t border-winter/10 pt-3 text-xs font-semibold text-muted-foreground">
                  Video links in file: {analysis.videos.length}
                  {analysis.videoInvalid > 0 ? ` (${analysis.videoInvalid} ignored) — ` : " — "}
                  {mode === "replace"
                    ? "they will replace the current video list."
                    : `${analysis.videoAdded} new, ${analysis.videoUpdated} updated by id.`}
                </p>
              )}
              {(analysis.invalid > 0 || analysis.skipped > 0) && (
                <ul className="thin-scroll mt-3 max-h-28 space-y-1 overflow-y-auto border-t border-winter/10 pt-3 text-xs">
                  {analysis.items
                    .filter((item) => item.status === "invalid" || item.status === "skip")
                    .map((item) => (
                      <li
                        key={item.index}
                        className={
                          item.status === "invalid"
                            ? "font-semibold text-destructive"
                            : "font-semibold text-muted-foreground"
                        }
                      >
                        Item {item.index + 1}: {item.reason}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="glass-chip rounded-xl px-5 py-3 text-sm font-bold text-winter"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!canApply}
              className="rounded-xl bg-gradient-to-b from-winter to-midnight px-6 py-3 text-sm font-bold tracking-wide text-snow shadow-lg shadow-winter/25 transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Import {analysis.products.length} product{analysis.products.length === 1 ? "" : "s"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
