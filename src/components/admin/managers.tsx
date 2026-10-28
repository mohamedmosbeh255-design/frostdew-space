"use client";

import { useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, X, RefreshCw, Play } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  type Category,
  type HeroConfig,
  type IntroductionConfig,
  type BrandConfig,
  type SocialLink,
  type SocialPlatform,
  type StoreData,
  type VideoLink,
} from "@/config/store";
import { slugify } from "@/lib/store";
import { Field, inputClass, SaveButton, SavedIndicator, SectionCard } from "./fields";
import SocialIcon, { PLATFORM_LABELS, SOCIAL_PLATFORMS } from "@/components/winter/SocialIcons";

type Update = (patch: Partial<StoreData>) => void;

/* ------------------------- Categories manager --------------------- */

export function CategoriesManager({
  categories,
  products,
  update,
}: {
  categories: Category[];
  products: StoreData["products"];
  update: Update;
}) {
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<Category | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<Category | null>(null);
  const countFor = (id: string) => products.filter((p) => p.categories.includes(id)).length;

  const add = (e: FormEvent) => {
    e.preventDefault();
    const label = newName.trim();
    if (!label) return;
    const id = slugify(label);
    if (categories.some((c) => c.id === id)) {
      setNewName("");
      return;
    }
    update({ categories: [...categories, { id, label }] });
    setNewName("");
  };

  const rename = () => {
    if (!renaming) return;
    const label = renameValue.trim();
    if (!label) return;
    update({ categories: categories.map((c) => (c.id === renaming.id ? { ...c, label } : c)) });
    setRenaming(null);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const affected = countFor(deleting.id);
    let nextProducts = products;
    if (affected > 0) {
      nextProducts = products.map((p) =>
        p.categories.includes(deleting.id)
          ? { ...p, categories: p.categories.filter((c) => c !== deleting.id) }
          : p,
      );
    }
    update({ products: nextProducts, categories: categories.filter((c) => c.id !== deleting.id) });
    setDeleting(null);
  };

  return (
    <SectionCard
      title="Categories"
      description="Rename or remove collections. Categories used by products move those products to Uncategorized when deleted."
    >
      <form onSubmit={add} className="mb-6 flex gap-2.5">
        <input
          className={inputClass}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name, e.g. Exfoliators"
          aria-label="New category name"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-winter to-midnight px-5 py-2.5 text-sm font-bold text-snow shadow-lg shadow-winter/25 transition-all duration-300 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add
        </button>
      </form>

      <ul className="divide-y divide-winter/10 rounded-2xl border border-white/60 bg-white/40">
        {categories.map((cat) => {
          const count = countFor(cat.id);
          return (
            <li key={cat.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-midnight">{cat.label}</p>
                <p className="text-xs text-muted-foreground">
                  {count} product{count === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  aria-label={`Rename ${cat.label}`}
                  onClick={() => {
                    setRenaming(cat);
                    setRenameValue(cat.label);
                  }}
                  className="glass-chip flex h-9 w-9 items-center justify-center rounded-xl text-winter hover:scale-105"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${cat.label}`}
                  onClick={() => setDeleting(cat)}
                  className="glass-chip flex h-9 w-9 items-center justify-center rounded-xl text-destructive hover:scale-105"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Rename dialog */}
      <DialogPrimitive.Root open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-midnight/30 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="glass-deep fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] p-7 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300">
            <DialogPrimitive.Title className="font-display text-xl font-medium text-midnight">
              Rename category
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1.5 text-sm text-muted-foreground">
              Products keep their link to this category — only the display name changes.
            </DialogPrimitive.Description>
            <label htmlFor="rename-category" className="sr-only">
              Category name
            </label>
            <input
              id="rename-category"
              className={`${inputClass} mt-5`}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), rename())}
            />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setRenaming(null)} className="glass-chip rounded-xl px-5 py-2.5 text-sm font-bold text-winter">
                Cancel
              </button>
              <button
                type="button"
                onClick={rename}
                className="rounded-xl bg-gradient-to-b from-winter to-midnight px-5 py-2.5 text-sm font-bold text-snow"
              >
                Rename
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Delete dialog */}
      <DialogPrimitive.Root open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-midnight/30 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="glass-deep fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] p-7 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300">
            <DialogPrimitive.Title className="font-display text-xl font-medium text-midnight">
              Delete &ldquo;{deleting?.label}&rdquo;?
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              {deleting && countFor(deleting.id) > 0 ? (
                <>
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
                  {countFor(deleting.id)} product(s) use this category and will move to
                  Uncategorized.
                </>
              ) : (
                "This category will be removed from the storefront filters."
              )}
            </DialogPrimitive.Description>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleting(null)} className="glass-chip rounded-xl px-5 py-2.5 text-sm font-bold text-winter">
                Keep it
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-destructive px-5 py-2.5 text-sm font-bold text-white shadow-lg"
              >
                Delete
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </SectionCard>
  );
}

/* ------------------------- Social links manager ------------------- */

const VIDEO_ROW_PLACEHOLDER = "video-row";

/** Draft rows: the saved list plus empty rows so there are always at
 *  least 4 rows ready to fill (the "Add video" default). */
function seedVideoDraft(saved: VideoLink[]): VideoLink[] {
  const rows = saved.map((v) => ({ ...v }));
  const stamp = Date.now().toString(36);
  while (rows.length < 4) {
    rows.push({
      id: `${VIDEO_ROW_PLACEHOLDER}-${stamp}-${rows.length}`,
      title: "",
      url: "",
      thumbnail: "",
    });
  }
  return rows;
}

export function SocialManager({
  socialLinks,
  videos,
  update,
}: {
  socialLinks: SocialLink[];
  videos: VideoLink[];
  update: Update;
}) {
  const [draft, setDraft] = useState<SocialLink[]>(socialLinks);
  const [videoDraft, setVideoDraft] = useState<VideoLink[]>(() => seedVideoDraft(videos));
  const [saved, setSaved] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    // Completely empty video rows are drafting placeholders, not data —
    // they are dropped so the store (and backups) stay clean.
    update({
      socialLinks: draft.filter((d) => d.platform),
      videos: videoDraft.filter((v) => v.title.trim() || v.url.trim() || v.thumbnail.trim()),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const setLink = (id: string, patch: Partial<SocialLink>) =>
    setDraft((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const addRow = () => {
    const used = new Set(draft.map((d) => d.platform));
    const platform = SOCIAL_PLATFORMS.find((p) => !used.has(p)) ?? "instagram";
    setDraft((ds) => [
      ...ds,
      { id: `social-${platform}-${Date.now().toString(36)}`, platform, url: "", enabled: true, description: "" },
    ]);
  };

  const setVideo = (id: string, patch: Partial<VideoLink>) =>
    setVideoDraft((ds) => ds.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const addVideoRow = () =>
    setVideoDraft((ds) => [
      ...ds,
      {
        id: `${VIDEO_ROW_PLACEHOLDER}-${Date.now().toString(36)}-${ds.length}`,
        title: "",
        url: "",
        thumbnail: "",
      },
    ]);

  const removeVideoRow = (id: string) =>
    setVideoDraft((ds) => ds.filter((v) => v.id !== id));

  return (
    <SectionCard title="Social Links" description="Paste real profile URLs and choose which cards appear on the public site. Empty URLs show a friendly “coming soon” card.">
      <form onSubmit={save}>
        <ul className="space-y-3">
          {draft.map((link) => (
            <li key={link.id} className="glass-chip flex flex-wrap items-center gap-3 rounded-2xl p-3.5">
              <span className="glass flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-winter">
                <SocialIcon platform={link.platform} className="h-4.5 w-4.5" />
              </span>
              <label className="sr-only" htmlFor={`platform-${link.id}`}>
                Platform
              </label>
              <select
                id={`platform-${link.id}`}
                className="rounded-lg border border-input bg-white/70 px-3 py-2 text-sm font-semibold text-midnight focus:border-glacier focus:outline-none"
                value={link.platform}
                onChange={(e) => setLink(link.id, { platform: e.target.value as SocialPlatform })}
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor={`url-${link.id}`}>
                {PLATFORM_LABELS[link.platform]} URL
              </label>
              <input
                id={`url-${link.id}`}
                type="url"
                className={`${inputClass} min-w-[180px] flex-1`}
                placeholder="https://…"
                value={link.url}
                onChange={(e) => setLink(link.id, { url: e.target.value })}
              />
              <button
                type="button"
                role="switch"
                aria-checked={link.enabled}
                aria-label={`Show ${PLATFORM_LABELS[link.platform]} on site`}
                onClick={() => setLink(link.id, { enabled: !link.enabled })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${link.enabled ? "bg-glacier" : "bg-muted-foreground/30"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${link.enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
              <button
                type="button"
                aria-label={`Remove ${PLATFORM_LABELS[link.platform]} row`}
                onClick={() => setDraft((ds) => ds.filter((d) => d.id !== link.id))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <button type="button" onClick={addRow} className="glass-chip flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-winter">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Social Link
          </button>
        </div>

        {/* ------------------- Video Links group ------------------- */}
        <div className="mt-8 border-t border-winter/10 pt-7">
          <h3 className="font-display text-lg font-medium text-midnight">Video Links</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Feature YouTube videos on the site. Give each one a short title and its URL — the optional
            16:9 thumbnail becomes the card image (a frosted glass panel is generated without one). Cards
            appear in the &ldquo;Watch&rdquo; section, just above the social cards.
          </p>
          <ul className="mt-4 space-y-3">
            {videoDraft.map((video, index) => (
              <li key={video.id} className="glass-chip rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  <span className="glass flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-winter">
                    <Play className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="grid min-w-0 flex-1 gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.2fr)]">
                    <label className="sr-only" htmlFor={`video-title-${video.id}`}>
                      Video title
                    </label>
                    <input
                      id={`video-title-${video.id}`}
                      className={inputClass}
                      placeholder='Title, e.g. "Winter routine"'
                      value={video.title}
                      onChange={(e) => setVideo(video.id, { title: e.target.value })}
                    />
                    <label className="sr-only" htmlFor={`video-url-${video.id}`}>
                      YouTube URL
                    </label>
                    <input
                      id={`video-url-${video.id}`}
                      type="url"
                      className={inputClass}
                      placeholder="https://youtube.com/…"
                      value={video.url}
                      onChange={(e) => setVideo(video.id, { url: e.target.value })}
                    />
                    <label className="sr-only" htmlFor={`video-thumb-${video.id}`}>
                      Thumbnail URL (optional)
                    </label>
                    {/* type="text" (not url): relative paths like /hero/hero-poster.jpg
                        are valid thumbnails, and type="url" constraint validation would
                        silently block the whole section's Save. Same pattern as HeroVideo. */}
                    <input
                      id={`video-thumb-${video.id}`}
                      type="text"
                      className={inputClass}
                      placeholder="Thumbnail URL — optional 16:9 image"
                      value={video.thumbnail}
                      onChange={(e) => setVideo(video.id, { thumbnail: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={
                      video.title.trim()
                        ? `Remove video "${video.title.trim()}"`
                        : `Remove video row ${index + 1}`
                    }
                    onClick={() => removeVideoRow(video.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <button
              type="button"
              onClick={addVideoRow}
              className="glass-chip flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-winter"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add video
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <SaveButton />
          <SavedIndicator show={saved} />
        </div>
      </form>
    </SectionCard>
  );
}

/* ------------------------- Hero video manager --------------------- */

export function HeroManager({
  heroConfig,
  update,
}: {
  heroConfig: HeroConfig;
  update: Update;
}) {
  const [draft, setDraft] = useState<HeroConfig>(heroConfig);
  const [saved, setSaved] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    update({
      heroConfig: {
        ...draft,
        overlayOpacity: Math.min(0.6, Math.max(0, Number(draft.overlayOpacity) || 0)),
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const set = <K extends keyof HeroConfig>(key: K, value: HeroConfig[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <SectionCard title="Hero Video" description="Point the hero at any video file or URL. It autoplays muted, loops, and falls back to the poster image.">
      <form onSubmit={save}>
        <Field label="Video source URL" htmlFor="hm-video">
          <input id="hm-video" type="text" className={inputClass} value={draft.videoSource} onChange={(e) => set("videoSource", e.target.value)} placeholder="/hero/hero-video.mp4 or https://…" />
        </Field>
        <Field label="Poster image URL" htmlFor="hm-poster" hint="Shown while loading and if autoplay is unavailable.">
          <input id="hm-poster" type="text" className={inputClass} value={draft.posterSource} onChange={(e) => set("posterSource", e.target.value)} placeholder="/hero/hero-poster.jpg" />
        </Field>
        <Field label={`Overlay opacity — ${Number(draft.overlayOpacity).toFixed(2)}`} htmlFor="hm-opacity">
          <input
            id="hm-opacity"
            type="range"
            min="0"
            max="0.6"
            step="0.02"
            value={draft.overlayOpacity}
            onChange={(e) => set("overlayOpacity", Number(e.target.value))}
            className="w-full accent-winter"
          />
        </Field>
        <div className="grid gap-x-5 sm:grid-cols-2">
          <Field label="Object fit" htmlFor="hm-fit">
            <select id="hm-fit" className={inputClass} value={draft.objectFit} onChange={(e) => set("objectFit", e.target.value as "cover" | "contain")}>
              <option value="cover">cover</option>
              <option value="contain">contain</option>
            </select>
          </Field>
          <Field label="Object position" htmlFor="hm-pos" hint='e.g. "center center" or "50% 30%"'>
            <input id="hm-pos" className={inputClass} value={draft.objectPosition} onChange={(e) => set("objectPosition", e.target.value)} />
          </Field>
        </div>
        <div className="flex items-center gap-4">
          <SaveButton />
          <SavedIndicator show={saved} />
        </div>
      </form>
    </SectionCard>
  );
}

/* ------------------------- Brand manager -------------------------- */

export function BrandManager({
  brandConfig,
  update,
}: {
  brandConfig: BrandConfig;
  update: Update;
}) {
  const [draft, setDraft] = useState<BrandConfig>(brandConfig);
  const [saved, setSaved] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    update({ brandConfig: { ...draft, brandName: draft.brandName.trim() || "FROSTDEW" } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  return (
    <SectionCard title="Brand" description="The name glows at the center of the hero video; the tagline sits just beneath it.">
      <form onSubmit={save}>
        <Field label="Brand name" htmlFor="bm-name">
          <input id="bm-name" className={inputClass} value={draft.brandName} onChange={(e) => setDraft((d) => ({ ...d, brandName: e.target.value }))} />
        </Field>
        <Field label="Tagline" htmlFor="bm-tagline">
          <input id="bm-tagline" className={inputClass} value={draft.tagline} onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))} />
        </Field>
        <Field label="Copyright notice" htmlFor="bm-copy">
          <input id="bm-copy" className={inputClass} value={draft.copyright} onChange={(e) => setDraft((d) => ({ ...d, copyright: e.target.value }))} placeholder="© 2026 FrostDew. All rights reserved." />
        </Field>
        <div className="flex items-center gap-4">
          <SaveButton />
          <SavedIndicator show={saved} />
        </div>
      </form>
    </SectionCard>
  );
}

/* ---------------------- Introduction manager ---------------------- */

export function IntroductionManager({
  introductionConfig,
  update,
}: {
  introductionConfig: IntroductionConfig;
  update: Update;
}) {
  const [draft, setDraft] = useState<IntroductionConfig>(introductionConfig);
  const [saved, setSaved] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    update({ introductionConfig: draft });
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const set = <K extends keyof IntroductionConfig>(key: K, value: IntroductionConfig[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <SectionCard title="Introduction" description="The welcoming copy that appears after the wind transition.">
      <form onSubmit={save}>
        <Field label="Heading" htmlFor="im-heading">
          <input id="im-heading" className={inputClass} value={draft.heading} onChange={(e) => set("heading", e.target.value)} />
        </Field>
        <Field label="Short description" htmlFor="im-short">
          <textarea id="im-short" rows={2} className={`${inputClass} resize-y`} value={draft.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
        </Field>
        <Field label="Extended description" htmlFor="im-extended">
          <textarea id="im-extended" rows={5} className={`${inputClass} resize-y`} value={draft.extendedDescription} onChange={(e) => set("extendedDescription", e.target.value)} />
        </Field>
        <div className="grid gap-x-5 sm:grid-cols-2">
          <Field label="CTA button label" htmlFor="im-cta-label">
            <input id="im-cta-label" className={inputClass} value={draft.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
          </Field>
          <Field label="CTA button URL" htmlFor="im-cta-url" hint="Use #shop to send visitors to the collection.">
            <input id="im-cta-url" className={inputClass} value={draft.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} />
          </Field>
        </div>
        <div className="flex items-center gap-4">
          <SaveButton />
          <SavedIndicator show={saved} />
        </div>
      </form>
    </SectionCard>
  );
}
