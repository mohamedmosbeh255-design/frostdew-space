"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X, Check, Download, Upload, AlertTriangle } from "lucide-react";
import {
  type Category,
  type PlaceholderArt,
  type Product,
  type ProductStatus,
  type ProductStoreKey,
  type StoreData,
  type VideoLink,
} from "@/config/store";
import { slugify } from "@/lib/store";
import ProductArt from "@/components/winter/ProductArt";
import { Field, inputClass } from "./fields";
import ImportDialog, { exportProductsToJson } from "./ProductBackup";

const ART_BY_CATEGORY: Record<string, PlaceholderArt> = {
  cleansers: "pump",
  toners: "bottle",
  serums: "dropper",
  moisturizers: "jar",
  sunscreens: "tube",
  "lip-care": "pot",
  "gift-sets": "pot",
};

interface ProductFormState {
  id: string;
  name: string;
  price: string;
  currency: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  gallery: string[];
  amazonUs: string;
  amazonUk: string;
  stylevana: string;
  oliveYoung: string;
  badge: string;
  available: boolean;
  buttonLabel: string;
  status: ProductStatus;
  art: PlaceholderArt;
}

const EMPTY_FORM: ProductFormState = {
  id: "",
  name: "",
  price: "",
  currency: "USD",
  category: "",
  shortDescription: "",
  fullDescription: "",
  image: "",
  gallery: [""],
  amazonUs: "",
  amazonUk: "",
  stylevana: "",
  oliveYoung: "",
  badge: "",
  available: true,
  buttonLabel: "Get it Now",
  status: "active",
  art: "bottle",
};

/* The four per-store affiliate boxes, in display order. */
const STORE_FIELDS: {
  key: ProductStoreKey;
  label: string;
  helper: string;
  placeholder: string;
}[] = [
  {
    key: "amazonUs",
    label: "Amazon US link",
    helper: "Must contain tag=beautynest202-20",
    placeholder: "https://www.amazon.com/dp/…",
  },
  {
    key: "amazonUk",
    label: "Amazon UK link",
    helper: "Must contain tag=beautynestkor-21",
    placeholder: "https://www.amazon.co.uk/dp/…",
  },
  {
    key: "stylevana",
    label: "Stylevana link",
    helper: "Awin deep link (awin1.com/cread.php…)",
    placeholder: "https://www.awin1.com/cread.php?…",
  },
  {
    key: "oliveYoung",
    label: "Olive Young link",
    helper: "Global Olive Young product page",
    placeholder: "https://global.oliveyoung.com/…",
  },
];

/** Soft validation — shows an inline warning but never blocks saving:
 *  links must start with https:// and Amazon links must carry their
 *  correct affiliate tag. Empty boxes are simply skipped. */
function storeLinkWarning(key: ProductStoreKey, value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (!/^https:\/\//i.test(v)) return "Link must start with https://";
  if (key === "amazonUs" && !v.includes("beautynest202-20"))
    return "Missing affiliate tag — the link must contain tag=beautynest202-20";
  if (key === "amazonUk" && !v.includes("beautynestkor-21"))
    return "Missing affiliate tag — the link must contain tag=beautynestkor-21";
  return "";
}

function toForm(product: Product): ProductFormState {
  return {
    id: product.id,
    name: product.name,
    price: product.price == null ? "" : String(product.price),
    currency: product.currency || "USD",
    category: product.categories[0] ?? "",
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    image: product.image,
    gallery: product.gallery.length ? product.gallery : [""],
    amazonUs: product.links?.amazonUs ?? "",
    amazonUk: product.links?.amazonUk ?? "",
    stylevana: product.links?.stylevana ?? "",
    oliveYoung: product.links?.oliveYoung ?? "",
    badge: product.badge ?? "",
    available: product.available !== false,
    buttonLabel: product.buttonLabel ?? "Get it Now",
    status: product.status,
    art: product.art,
  };
}

function ImageThumb({ product, size = "h-14 w-14" }: { product: Product; size?: string }) {
  const [failed, setFailed] = useState(false);
  if (product.image && !failed) {
    return <img src={product.image} alt="" className={`${size} rounded-xl object-cover`} onError={() => setFailed(true)} />;
  }
  return <ProductArt art={product.art} name={product.name} className={`${size} rounded-xl object-cover`} />;
}

export default function ProductManager({
  products,
  categories,
  videos,
  update,
}: {
  products: Product[];
  categories: Category[];
  videos: VideoLink[];
  update: (patch: Partial<StoreData>) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3600);
  };

  const applyImport = (
    next: Product[],
    importedCount: number,
    nextVideos: VideoLink[] | null,
    importedVideos: number,
  ) => {
    update(nextVideos ? { products: next, videos: nextVideos } : { products: next });
    setImportOpen(false);
    const productPart = `${importedCount} product${importedCount === 1 ? "" : "s"}`;
    showToast(
      importedVideos > 0
        ? `Imported ${productPart} and ${importedVideos} video link${importedVideos === 1 ? "" : "s"}`
        : `Imported ${productPart}`,
    );
  };

  const categoryLabel = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.label]));
    return (id: string) => map.get(id) ?? "Uncategorized";
  }, [categories]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?.id ?? "" });
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm(toForm(product));
    setFormError("");
    setFormOpen(true);
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Product name is required.");
    // Price is OPTIONAL (affiliate policy: prices are never displayed).
    // Empty box -> product without a price — perfectly valid.
    let price: number | undefined;
    if (form.price.trim() !== "") {
      const parsed = Number(form.price);
      if (Number.isNaN(parsed) || parsed < 0)
        return setFormError("Price must be a number — or leave the box empty.");
      price = parsed;
    }

    const art: PlaceholderArt = form.art ?? ART_BY_CATEGORY[form.category] ?? "bottle";
    const base: Product = {
      id: editing?.id || `${slugify(form.name) || "product"}-${Date.now().toString(36)}`,
      name: form.name.trim(),
      price,
      // Display-only metadata + catalog values that have no form box are
      // carried over untouched from the product being edited — an edit
      // must never silently wipe rating/reviewCount/size/compare-at/as-of
      // data (the owner maintains them via verified JSON import).
      compareAtPrice: editing?.compareAtPrice,
      priceCheckedDate: editing?.priceCheckedDate,
      rating: editing?.rating,
      reviewCount: editing?.reviewCount,
      currency: form.currency.trim() || "USD",
      categories: form.category ? [form.category] : [],
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim(),
      image: form.image.trim(),
      gallery: form.gallery.map((g) => g.trim()).filter(Boolean),
      // Legacy single url is never edited here any more — preserved as-is.
      url: editing?.url ?? "",
      links: {
        amazonUs: form.amazonUs.trim(),
        amazonUk: form.amazonUk.trim(),
        stylevana: form.stylevana.trim(),
        oliveYoung: form.oliveYoung.trim(),
      },
      badge: form.badge.trim() || undefined,
      available: form.available,
      size: editing?.size,
      features: editing?.features,
      buttonLabel: form.buttonLabel.trim() || "Get it Now",
      status: form.status,
      art,
    };
    const next = editing
      ? products.map((p) => (p.id === editing.id ? base : p))
      : [...products, base];
    update({ products: next });
    setFormOpen(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2400);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    update({ products: products.filter((p) => p.id !== deleting.id) });
    setDeleting(null);
  };

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium text-midnight">Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} item{products.length === 1 ? "" : "s"} in the catalog · changes save
            instantly and appear on the public site
            {justSaved && (
              <span className="ml-2 inline-flex items-center gap-1 font-bold text-glacier">
                <Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => exportProductsToJson(products, videos)}
              className="glass-chip flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-winter transition-all duration-300 hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Export JSON
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="glass-chip flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-winter transition-all duration-300 hover:-translate-y-0.5"
            >
              <Upload className="h-4 w-4" aria-hidden="true" /> Import JSON
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-winter to-midnight px-5 py-2.5 text-sm font-bold text-snow shadow-lg shadow-winter/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Product
            </button>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            Backup your catalog — data is stored only in this browser.
          </p>
        </div>
      </div>

      {/* Responsive table */}
      <div className="glass-deep overflow-hidden rounded-[1.5rem]">
        <div className="hidden grid-cols-[64px_1.8fr_1.1fr_0.9fr_auto] items-center gap-4 border-b border-winter/10 px-5 py-3.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-glacier md:grid">
          <span>Image</span>
          <span>Name</span>
          <span>Category</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y divide-winter/10">
          {products.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-1 items-center gap-3 px-5 py-4 md:grid-cols-[64px_1.8fr_1.1fr_0.9fr_auto] md:gap-4"
            >
              <ImageThumb product={p} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-midnight">{p.name}</p>
                {p.badge && (
                  <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-winter">
                    {p.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {p.categories.map(categoryLabel).join(", ") || "Uncategorized"}
              </p>
              <p>
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${
                    p.status === "active"
                      ? "bg-glacier/20 text-winter"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.status === "active" ? "Active" : "Draft"}
                </span>
                {p.available === false && (
                  <span className="ml-1.5 inline-block rounded-full bg-destructive/10 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-destructive">
                    Sold out
                  </span>
                )}
              </p>
              <div className="flex justify-start gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  aria-label={`Edit ${p.name}`}
                  className="glass-chip flex h-9 w-9 items-center justify-center rounded-xl text-winter transition-all duration-300 hover:scale-105"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(p)}
                  aria-label={`Delete ${p.name}`}
                  className="glass-chip flex h-9 w-9 items-center justify-center rounded-xl text-destructive transition-all duration-300 hover:scale-105"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
          {products.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">
              No products yet — add your first winter essential.
            </li>
          )}
        </ul>
      </div>

      {/* Add / Edit modal */}
      <DialogPrimitive.Root
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) setFormOpen(false);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-midnight/30 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="glass-deep thin-scroll fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.75rem] p-6 focus:outline-none sm:p-8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300">
            <DialogPrimitive.Title className="font-display text-2xl font-medium text-midnight">
              {editing ? "Edit product" : "Add product"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
              Fields marked required must be filled. Leave a store box empty when the product
              is not sold in that store — empty links simply hide the buy buttons.
            </DialogPrimitive.Description>
            <DialogPrimitive.Close
              aria-label="Close form"
              className="glass-chip absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-winter"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>

            <form onSubmit={save} className="mt-6" noValidate>
              <div className="grid gap-x-5 sm:grid-cols-2">
                <Field label="Product name (required)" htmlFor="pf-name">
                  <input
                    id="pf-name"
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Green Tea SPF 50+ Sun Fluid"
                    required
                  />
                </Field>
                <div className="grid grid-cols-[1fr_100px] gap-3">
                  <Field label="Price (optional — never shown on the site)" htmlFor="pf-price">
                    <input
                      id="pf-price"
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Currency" htmlFor="pf-currency">
                    <input
                      id="pf-currency"
                      className={inputClass}
                      value={form.currency}
                      onChange={(e) => set("currency", e.target.value.toUpperCase())}
                      maxLength={3}
                    />
                  </Field>
                </div>
              </div>

              <Field label="Category" htmlFor="pf-category">
                <select
                  id="pf-category"
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Short description" htmlFor="pf-short">
                <textarea
                  id="pf-short"
                  rows={2}
                  className={`${inputClass} resize-y`}
                  value={form.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                  placeholder="One or two selling sentences shown on the card."
                />
              </Field>

              <Field label="Full description" htmlFor="pf-full">
                <textarea
                  id="pf-full"
                  rows={5}
                  className={`${inputClass} resize-y`}
                  value={form.fullDescription}
                  onChange={(e) => set("fullDescription", e.target.value)}
                  placeholder="The complete story shown inside the product popup. Blank lines create paragraphs."
                />
              </Field>

              <Field label="Product image URL" htmlFor="pf-image" hint="Leave empty to use FrostDew placeholder artwork.">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/70 bg-ice/40">
                    {form.image.trim() ? (
                      <img
                        src={form.image}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.15")}
                        onLoad={(e) => ((e.target as HTMLImageElement).style.opacity = "1")}
                      />
                    ) : (
                      <ProductArt art={form.art} name="Preview" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <input
                    id="pf-image"
                    type="url"
                    className={inputClass}
                    value={form.image}
                    onChange={(e) => set("image", e.target.value)}
                    placeholder="https://…/product-photo.jpg"
                  />
                </div>
              </Field>

              <Field label="Additional image URLs" hint="One per row — shown as a gallery in the product popup.">
                <div className="space-y-2">
                  {form.gallery.map((g, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="url"
                        aria-label={`Additional image URL ${i + 1}`}
                        className={inputClass}
                        value={g}
                        onChange={(e) =>
                          set(
                            "gallery",
                            form.gallery.map((v, j) => (j === i ? e.target.value : v)),
                          )
                        }
                        placeholder="https://…/angle-2.jpg"
                      />
                      <button
                        type="button"
                        onClick={() => set("gallery", form.gallery.filter((_, j) => j !== i))}
                        aria-label={`Remove image URL ${i + 1}`}
                        className="glass-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-destructive"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => set("gallery", [...form.gallery, ""])}
                    className="glass-chip flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-winter"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add image row
                  </button>
                </div>
              </Field>

              {STORE_FIELDS.map((store) => {
                const value = form[store.key];
                const warning = storeLinkWarning(store.key, value);
                return (
                  <Field key={store.key} label={store.label} htmlFor={`pf-${store.key}`}>
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-winter"
                      >
                        {store.label.replace(" link", "")}
                      </span>
                      <input
                        id={`pf-${store.key}`}
                        type="url"
                        className={inputClass}
                        value={value}
                        onChange={(e) => set(store.key, e.target.value)}
                        placeholder={store.placeholder}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{store.helper}</p>
                    {warning && (
                      <p
                        role="status"
                        className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-candle/20 px-3 py-2 text-xs font-semibold leading-snug text-midnight"
                      >
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-berry" aria-hidden="true" />
                        {warning}
                      </p>
                    )}
                  </Field>
                );
              })}

              <div className="grid gap-x-5 sm:grid-cols-2">
                <Field label="Badge (optional)" htmlFor="pf-badge">
                  <input
                    id="pf-badge"
                    className={inputClass}
                    value={form.badge}
                    onChange={(e) => set("badge", e.target.value)}
                    placeholder="Bestseller · New · Sale"
                  />
                </Field>
                <Field label="Button label" htmlFor="pf-button">
                  <input
                    id="pf-button"
                    className={inputClass}
                    value={form.buttonLabel}
                    onChange={(e) => set("buttonLabel", e.target.value)}
                    placeholder="Get it Now"
                  />
                </Field>
              </div>

              <div className="grid gap-x-5 sm:grid-cols-2">
                <div className="glass-chip mt-1 mb-4 flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm font-bold text-winter">Availability</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.available}
                    aria-label="In stock"
                    onClick={() => set("available", !form.available)}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${form.available ? "bg-glacier" : "bg-muted-foreground/30"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${form.available ? "left-[22px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
                <div className="glass-chip mt-1 mb-4 flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm font-bold text-winter">
                    {form.status === "active" ? "Active" : "Draft"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.status === "active"}
                    aria-label="Active status"
                    onClick={() => set("status", form.status === "active" ? "draft" : "active")}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${form.status === "active" ? "bg-glacier" : "bg-muted-foreground/30"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${form.status === "active" ? "left-[22px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
              </div>

              {formError && (
                <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive" role="alert">
                  {formError}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="glass-chip rounded-xl px-5 py-3 text-sm font-bold text-winter"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-b from-winter to-midnight px-6 py-3 text-sm font-bold tracking-wide text-snow shadow-lg shadow-winter/25 transition-all duration-300 hover:-translate-y-0.5"
                >
                  {editing ? "Save product" : "Add product"}
                </button>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Delete confirmation */}
      <DialogPrimitive.Root open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-midnight/30 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="glass-deep fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] p-7 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300">
            <DialogPrimitive.Title className="font-display text-xl font-medium text-midnight">
              Remove this product?
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{deleting?.name}&rdquo; will disappear from the storefront immediately. This
              cannot be undone.
            </DialogPrimitive.Description>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="glass-chip rounded-xl px-5 py-2.5 text-sm font-bold text-winter"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-destructive px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                Remove
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* JSON import (backup / restore) */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        products={products}
        videos={videos}
        onApply={applyImport}
      />

      {/* Success toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="glass-deep fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-bold text-winter shadow-xl duration-300 animate-in fade-in slide-in-from-bottom-3"
        >
          <Check className="h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
          {toast}
        </div>
      )}
    </div>
  );
}
