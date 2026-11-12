"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import {
  ADDED_DATE_PATTERN,
  AFFILIATE,
  ALLOWED_CATEGORIES,
  ALLOWED_STORES,
  CURRENCY_OPTIONS,
  MAX_EXTRA_PRODUCT_IMAGES,
  PRICE_PATTERN,
  isValidImageSource,
  productDuplicateKey,
  validateAffiliate,
} from "@/lib/product-rules.mjs"
import { mediaSourceKey } from "@/lib/media-source.mjs"
import type { Product } from "@/lib/products"
import { parsePrice, storeLabel, todayIsoDate } from "@/lib/format"
import {
  STORE_LINK_META,
  STORE_LINK_ORDER,
  type StoreLinkKey,
} from "@/lib/store-links"
import MediaUploadButton, { MediaPreview } from "./media-upload"
import RelatedProductsPicker, {
  type RelatedProductOption,
} from "./related-products-picker"

type Mode = "create" | "edit"

/** A "Store Pricing" row while it is being edited: every value is a string. */
type StorePricingRow = {
  store: string
  price: string
  currency: string
  url: string
}

const EMPTY_STORE_PRICING_ROW: StorePricingRow = {
  store: "",
  price: "",
  currency: "USD",
  url: "",
}

const isBlankStorePricingRow = (row: StorePricingRow): boolean =>
  !row.store.trim() && !row.price.trim() && !row.url.trim()

const DUPLICATE_NAME_MESSAGE = "A product with this name already exists."
const DUPLICATE_ID_MESSAGE = "A product with this ID already exists."

type FormState = {
  id: string
  brand: string
  name: string
  fullName: string
  short: string
  description: string
  image: string
  images: string[]
  url: string
  store: string
  categories: string[]
  features: string
  bestseller: boolean
  price: string
  salePrice: string
  rating: string
  reviewCount: string
  addedDate: string
  affiliateLinks: Record<StoreLinkKey, string>
  storePricing: StorePricingRow[]
  relatedProducts: string[]
}

const CATEGORY_OPTIONS = [...ALLOWED_CATEGORIES].sort()
const STORE_OPTIONS = [...ALLOWED_STORES]

/** Subtle notes shown under a field whose affiliate parameters were completed automatically. */
const TAG_AUTO_NOTE = "Tag added automatically."
const PARAM_AUTO_NOTE = "Ref/Awin parameters added automatically."

const noteForStoreKey = (key: StoreLinkKey): string =>
  key === "stylevana" ? PARAM_AUTO_NOTE : TAG_AUTO_NOTE

/** The primary `store` select maps to its `affiliateLinks` slot (Amazon → Amazon US). */
const storeLinkKeyForStore = (store: string): StoreLinkKey | null =>
  STORE_LINK_ORDER.find((key) => STORE_LINK_META[key].legacyStore === store) ?? null

/** Best-effort slot for a free-text Store Pricing row name ("Amazon US" → Amazon US). */
const storeLinkKeyForName = (name: string): StoreLinkKey | null => {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes("uk") || normalized.includes("co.uk")) return "amazonUk"
  if (normalized.includes("amazon")) return "amazonUs"
  if (normalized.includes("stylevana")) return "stylevana"
  return null
}

/**
 * Completes the affiliate parameters a pasted URL is missing (Amazon tag,
 * Stylevana ref, Awin ids) so `validateAffiliate` accepts it on save. Hosts
 * that cannot be repaired (a amazon.co.uk link in the Amazon US slot, for
 * example) are returned untouched for the server to judge.
 */
const normalizeAffiliateValue = (key: StoreLinkKey, raw: string): string => {
  const trimmed = raw.trim()
  if (!trimmed) return raw

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return raw
  }
  if (url.protocol !== "https:") return raw

  const host = url.hostname.toLowerCase()
  let changed = false

  if (key === "amazonUs" || key === "amazonUk") {
    const expectedTag = key === "amazonUs" ? AFFILIATE.amazonUs : AFFILIATE.amazonUk
    const allowedHosts =
      key === "amazonUs"
        ? ["www.amazon.com", "amazon.com", "amzn.to"]
        : ["www.amazon.co.uk", "amazon.co.uk"]
    if (allowedHosts.includes(host)) {
      const tags = url.searchParams.getAll("tag")
      if (tags.length !== 1 || tags[0] !== expectedTag) {
        url.searchParams.set("tag", expectedTag)
        changed = true
      }
    }
  } else if (host === "www.stylevana.com" || host === "stylevana.com") {
    const refs = url.searchParams.getAll("ref")
    if (refs.length !== 1 || refs[0] !== AFFILIATE.stylevanaRef) {
      url.searchParams.set("ref", AFFILIATE.stylevanaRef)
      changed = true
    }
  } else if (host === "www.awin1.com" || host === "awin1.com") {
    if (url.searchParams.get("awinmid") !== AFFILIATE.awinMid) {
      url.searchParams.set("awinmid", AFFILIATE.awinMid)
      changed = true
    }
    if (url.searchParams.get("awinaffid") !== AFFILIATE.awinAffid) {
      url.searchParams.set("awinaffid", AFFILIATE.awinAffid)
      changed = true
    }
  }

  return changed ? url.toString() : raw
}

/** Legacy `url` normalization follows whichever store is selected. */
const normalizePrimaryUrl = (store: string, raw: string): string => {
  const key = storeLinkKeyForStore(store)
  return key ? normalizeAffiliateValue(key, raw) : raw
}

const primaryNoteForStore = (store: string): string => {
  const key = storeLinkKeyForStore(store)
  return key ? noteForStoreKey(key) : TAG_AUTO_NOTE
}

/** ISO 4217 code for the currency symbols `PRICE_PATTERN` accepts. */
const CURRENCY_SYMBOL_TO_CODE: Record<string, string> = {
  $: "USD",
  "£": "GBP",
  "€": "EUR",
  "¥": "JPY",
  "₩": "KRW",
  "₹": "INR",
}

/** URL-safe slug for a new id: "Laneige Lip Glowy Balm" → "laneige-lip-glowy-balm". */
const slugifyId = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const isHttps = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

const isRealDate = (value: string): boolean => {
  if (!ADDED_DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const toInitialState = (product?: Product): FormState => ({
  id: product?.id ?? "",
  brand: product?.brand ?? "",
  name: product?.name ?? "",
  fullName: product?.fullName ?? "",
  short: product?.short ?? "",
  description: product?.description ?? "",
  image: product?.image ?? "",
  images: product?.images ? [...product.images] : [],
  url: product?.url ?? "",
  store: product?.store ?? "Amazon",
  categories: product?.categories ?? [],
  features: product?.features.join("\n") ?? "",
  bestseller: product?.bestseller ?? false,
  price: product?.price ?? "",
  salePrice: product?.salePrice ?? "",
  rating: product?.rating !== undefined ? String(product.rating) : "",
  reviewCount: product?.reviewCount !== undefined ? String(product.reviewCount) : "",
  addedDate: product?.addedDate ?? "",
  affiliateLinks: {
    amazonUs: product?.affiliateLinks?.amazonUs ?? "",
    amazonUk: product?.affiliateLinks?.amazonUk ?? "",
    stylevana: product?.affiliateLinks?.stylevana ?? "",
  },
  storePricing: (product?.storePricing ?? []).map((entry) => ({
    store: entry.store,
    price: String(entry.price),
    currency: entry.currency,
    url: entry.url,
  })),
  relatedProducts: product?.relatedProducts ? [...product.relatedProducts] : [],
})

function validate(values: FormState): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const field of ["brand", "name", "fullName", "short", "description"] as const) {
    if (!values[field].trim()) errors[field] = "This field is required."
  }

  if (!values.id.trim()) errors.id = "This field is required."
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.id.trim())) {
    errors.id = "Use a lowercase hyphenated slug, e.g. brand-product-name."
  }

  if (!values.image.trim()) errors.image = "This field is required."
  else if (!isValidImageSource(values.image.trim())) {
    errors.image = "Enter an https:// image URL or a local /uploads/... path."
  }

  if (values.images.length > MAX_EXTRA_PRODUCT_IMAGES) {
    errors.images = `Add ${MAX_EXTRA_PRODUCT_IMAGES} extra images or fewer.`
  }

  const seenImages = new Map<string, string>()
  const mainImageKey = mediaSourceKey(values.image.trim())
  if (mainImageKey) seenImages.set(mainImageKey, "the main image")

  values.images.forEach((raw, index) => {
    const field = `images.${index}`
    const image = raw.trim()
    if (!image) return

    if (!isValidImageSource(image)) {
      errors[field] = "Enter an https:// image URL or a local /uploads/... path."
      return
    }

    const key = mediaSourceKey(image)
    const reused = key ? seenImages.get(key) : undefined
    if (reused) {
      errors[field] = `This image is already used by ${reused}.`
      return
    }
    if (key) seenImages.set(key, `image ${index + 2}`)
  })

  if (!values.url.trim()) errors.url = "This field is required."
  else if (!isHttps(values.url.trim())) errors.url = "Enter an https product URL."

  if (!values.store) errors.store = "Choose a store."
  if (values.categories.length === 0) errors.categories = "Select at least one category."

  if (values.price.trim() && !PRICE_PATTERN.test(values.price.trim())) {
    errors.price = 'Use a currency symbol and amount, e.g. "$24.99" or "£19.99".'
  }

  if (values.salePrice.trim()) {
    if (!PRICE_PATTERN.test(values.salePrice.trim())) {
      errors.salePrice = 'Use a currency symbol and amount, e.g. "$17.50" or "£15.99".'
    } else if (!values.price.trim()) {
      errors.salePrice = "Add a regular price first."
    } else {
      const regular = parsePrice(values.price.trim())
      const sale = parsePrice(values.salePrice.trim())
      if (regular && sale) {
        if (regular.currency !== sale.currency) {
          errors.salePrice = "Use the same currency symbol as the regular price."
        } else if (sale.amount >= regular.amount) {
          errors.salePrice = "Sale price must be lower than the regular price."
        }
      }
    }
  }

  if (values.rating.trim()) {
    const rating = Number(values.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      errors.rating = "Rating must be between 1 and 5."
    }
  }

  if (values.reviewCount.trim()) {
    const count = Number(values.reviewCount)
    if (!Number.isInteger(count) || count < 0) {
      errors.reviewCount = "Review count must be a whole number of 0 or more."
    }
  }

  if (values.addedDate.trim() && !isRealDate(values.addedDate.trim())) {
    errors.addedDate = "Enter a valid date."
  }

  // Mirror the server rules for the extra store slots so mistakes surface before saving.
  const seenUrls = new Map<string, string>()
  if (values.url.trim() && isHttps(values.url.trim())) {
    seenUrls.set(new URL(values.url.trim()).href, "the legacy affiliate URL")
  }

  for (const key of STORE_LINK_ORDER) {
    const field = `affiliateLinks.${key}`
    const value = values.affiliateLinks[key].trim()
    if (!value) continue

    if (!isHttps(value)) {
      errors[field] = "Enter an https URL."
      continue
    }

    const url = new URL(value)
    const messages = validateAffiliate(
      { store: STORE_LINK_META[key].legacyStore },
      url,
    )
    if (messages.length > 0) errors[field] = messages[0]

    const reused = seenUrls.get(url.href)
    if (reused) {
      errors[field] = errors[field] ?? `Duplicate URL; also used by ${reused}.`
    } else {
      seenUrls.set(url.href, STORE_LINK_META[key].label)
    }
  }

  // Comparison prices: ignore fully blank rows, validate the rest. The server
  // repeats these rules as the source of truth.
  values.storePricing.forEach((row, index) => {
    if (isBlankStorePricingRow(row)) return

    const field = `storePricing.${index}`
    if (!row.store.trim()) {
      errors[`${field}.store`] = "Enter a store name."
    }

    const price = row.price.trim()
    if (!price) {
      errors[`${field}.price`] = "Enter a price."
    } else if (!/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) < 0) {
      errors[`${field}.price`] = "Use a number, e.g. 24.99."
    }

    if (!/^[A-Z]{3}$/.test(row.currency)) {
      errors[`${field}.currency`] = "Choose a currency."
    }

    if (!row.url.trim()) {
      errors[`${field}.url`] = "Enter the store URL."
    } else if (!isHttps(row.url.trim())) {
      errors[`${field}.url`] = "Enter an https URL."
    }
  })

  return errors
}

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  warning?: string
  hint?: string
  type?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  step?: string
  min?: string
  max?: string
  autoComplete?: string
  multiline?: boolean
  rows?: number
  /** Returns the corrected text for pasted input and on blur; identity leaves it untouched. */
  normalize?: (raw: string) => string
  /** Signals that `normalize` changed a value, so a subtle note can be shown. */
  onNormalized?: () => void
  /** Subtle note rendered under the field (for example after an automatic tag fix). */
  note?: string
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  warning,
  hint,
  type = "text",
  required,
  disabled,
  placeholder,
  step,
  min,
  max,
  autoComplete = "off",
  multiline,
  rows = 3,
  normalize,
  onNormalized,
  note,
}: TextFieldProps) {
  const shared = {
    id,
    name: id,
    value,
    required,
    disabled,
    placeholder,
    autoComplete,
    "aria-invalid": error || warning ? true : undefined,
    "aria-describedby":
      [error ? `${id}-error` : null, warning ? `${id}-warning` : null]
        .filter(Boolean)
        .join(" ") || undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
    onBlur: normalize
      ? () => {
          if (!value.trim()) return
          const fixed = normalize(value)
          if (fixed === value) return
          onChange(fixed)
          onNormalized?.()
        }
      : undefined,
    onPaste: normalize
      ? (event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const pasted = event.clipboardData.getData("text")
          const fixed = normalize(pasted)
          if (fixed === pasted) return
          event.preventDefault()
          const input = event.currentTarget
          const start = input.selectionStart ?? value.length
          const end = input.selectionEnd ?? start
          onChange(value.slice(0, start) + fixed + value.slice(end))
          onNormalized?.()
        }
      : undefined,
    className:
      "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-midnight outline-none focus-visible:ring-2 focus-visible:ring-glacier disabled:bg-muted disabled:text-muted-foreground",
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type={type} step={step} min={min} max={max} />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {note && <p className="text-xs font-medium text-glacier">{note}</p>}
      {warning && (
        <p
          id={`${id}-warning`}
          role="alert"
          className="rounded-md bg-amber-cta/10 px-2 py-1 text-xs font-semibold text-amber-800"
        >
          {warning}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default function ProductForm({
  mode,
  initial,
  productOptions = [],
}: {
  mode: Mode
  initial?: Product
  productOptions?: RelatedProductOption[]
}) {
  const router = useRouter()
  const [values, setValues] = useState<FormState>(() => toInitialState(initial))

  // New products — and edits of products saved before dates were required —
  // are stamped with today's date by default. Done after mount so the client's
  // calendar day is used (and so server/client markup matches).
  useEffect(() => {
    setValues((current) =>
      current.addedDate ? current : { ...current, addedDate: todayIsoDate() },
    )
  }, [mode, initial])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [imagesExpanded, setImagesExpanded] = useState(
    () => (initial?.images?.length ?? 0) > 0,
  )
  /** Field keys whose affiliate parameters were completed automatically. */
  const [autoFixed, setAutoFixed] = useState<Record<string, string>>({})
  /** Create mode only: whether the id was typed by hand (disables the auto-slug). */
  const [idEdited, setIdEdited] = useState(false)

  // Live duplicate check against the trimmed options already loaded by the
  // add/edit page. The API repeats this check as the source of truth.
  const nameMatch = useMemo(() => {
    const key = productDuplicateKey(values.brand, values.name)
    if (!key) return null

    return (
      productOptions.find(
        (option) =>
          option.id !== initial?.id &&
          productDuplicateKey(option.brand, option.name) === key,
      ) ?? null
    )
  }, [initial?.id, productOptions, values.brand, values.name])

  const idMatch = useMemo(() => {
    if (mode === "edit") return null
    const id = values.id.trim()
    if (!id) return null
    return productOptions.find((option) => option.id === id) ?? null
  }, [mode, productOptions, values.id])

  const saveBlocked =
    Boolean(nameMatch) ||
    Boolean(idMatch) ||
    errors.name === DUPLICATE_NAME_MESSAGE ||
    errors.id === DUPLICATE_ID_MESSAGE

  const markAutoFixed = (field: string, message: string) =>
    setAutoFixed((current) => ({ ...current, [field]: message }))

  const clearAutoFixed = (field: string) =>
    setAutoFixed((current) => {
      if (!(field in current)) return current
      const next = { ...current }
      delete next[field]
      return next
    })

  /** Drops every Store Pricing note (row indexes shift when rows are added/removed). */
  const clearRowAutoFixed = () =>
    setAutoFixed((current) => {
      const next: Record<string, string> = {}
      for (const [key, value] of Object.entries(current)) {
        if (!key.startsWith("storePricing.")) next[key] = value
      }
      return next
    })

  const clearImageErrors = () => {
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(next)) {
        if (key === "images" || key.startsWith("images.")) delete next[key]
      }
      return next
    })
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const fields = [String(key)]
      // The name warning depends on both sides of the brand + name key.
      if (key === "brand" || key === "name") fields.push("name")
      const next = { ...current }
      for (const field of fields) delete next[field]
      return next
    })
    clearAutoFixed(String(key))
    setMessage(null)
    setServerErrors([])
  }

  /** Create mode: keep the id in step with brand + name until it is typed by hand. */
  const syncIdFromIdentity = (identity: { brand?: string; name?: string }) => {
    if (mode !== "create" || idEdited) return
    const brand = identity.brand ?? values.brand
    const name = identity.name ?? values.name
    update("id", slugifyId(`${brand} ${name}`))
  }

  const updateAffiliateLink = (key: StoreLinkKey, value: string) => {
    setValues((current) => ({
      ...current,
      affiliateLinks: { ...current.affiliateLinks, [key]: value },
    }))
    // Clear a stale tag/host error as soon as the link is edited.
    setErrors((current) => {
      const field = `affiliateLinks.${key}`
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    clearAutoFixed(`affiliateLinks.${key}`)
  }

  const updateStorePricing = (
    index: number,
    field: keyof StorePricingRow,
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      storePricing: current.storePricing.map((row, position) =>
        position === index ? { ...row, [field]: value } : row,
      ),
    }))
    setErrors((current) => {
      const next = { ...current }
      delete next[`storePricing.${index}.${field}`]
      return next
    })
    clearAutoFixed(`storePricing.${index}.${field}`)
    setMessage(null)
  }

  const addStorePricing = () => {
    setValues((current) => ({
      ...current,
      storePricing: [...current.storePricing, { ...EMPTY_STORE_PRICING_ROW }],
    }))
    clearRowAutoFixed()
    setMessage(null)
  }

  const removeStorePricing = (index: number) => {
    setValues((current) => ({
      ...current,
      storePricing: current.storePricing.filter((_, position) => position !== index),
    }))
    setErrors((current) => {
      // Error keys are row indexes, so drop the removed row's entries and
      // renumber the rows after it; otherwise later messages attach to the
      // wrong row.
      const prefix = "storePricing."
      const next: Record<string, string> = {}
      for (const [key, value] of Object.entries(current)) {
        if (key.startsWith(`${prefix}${index}.`)) continue
        if (key.startsWith(prefix)) {
          const rest = key.slice(prefix.length)
          const dot = rest.indexOf(".")
          const rowIndex = Number(rest.slice(0, dot))
          if (Number.isInteger(rowIndex) && rowIndex > index) {
            next[`${prefix}${rowIndex - 1}${rest.slice(dot)}`] = value
            continue
          }
        }
        next[key] = value
      }
      return next
    })
    clearRowAutoFixed()
    setMessage(null)
  }

  const primaryStoreKey = storeLinkKeyForStore(values.store)
  const primaryCompareUrl =
    (primaryStoreKey ? values.affiliateLinks[primaryStoreKey].trim() : "") ||
    values.url.trim()
  const primaryComparePrice = values.price.trim()
    ? parsePrice(values.price.trim())
    : null
  const primaryAlreadyAdded = values.storePricing.some(
    (row) =>
      row.store.trim() === storeLabel(values.store) &&
      row.url.trim() === primaryCompareUrl,
  )
  /** Non-null when the one-click Compare row cannot be created (shown as a hint). */
  const primaryPrefillReason = !primaryStoreKey
    ? "Choose a primary store first."
    : !primaryCompareUrl
      ? "Add the primary Affiliate URL first."
      : !primaryComparePrice
        ? "Add the primary Price first."
        : primaryAlreadyAdded
          ? "The primary store is already in Compare prices."
          : null

  /** One click: mirror the primary store, price and URL into a Compare prices row. */
  const addPrimaryStorePricing = () => {
    if (!primaryStoreKey || !primaryCompareUrl || !primaryComparePrice) return

    setValues((current) => ({
      ...current,
      storePricing: [
        ...current.storePricing,
        {
          store: storeLabel(values.store),
          price: String(primaryComparePrice.amount),
          currency: CURRENCY_SYMBOL_TO_CODE[primaryComparePrice.currency] ?? "USD",
          url: normalizeAffiliateValue(primaryStoreKey, primaryCompareUrl),
        },
      ],
    }))
    clearRowAutoFixed()
    setMessage(null)
  }

  const updateImage = (index: number, value: string) => {
    setValues((current) => ({
      ...current,
      images: current.images.map((image, position) =>
        position === index ? value : image,
      ),
    }))
    setErrors((current) => {
      const next = { ...current }
      delete next[`images.${index}`]
      delete next.images
      return next
    })
    setMessage(null)
  }

  const addImage = () => {
    if (values.images.length >= MAX_EXTRA_PRODUCT_IMAGES) return
    setValues((current) => ({ ...current, images: [...current.images, ""] }))
    setImagesExpanded(true)
    clearImageErrors()
    setMessage(null)
  }

  const removeImage = (index: number) => {
    setValues((current) => ({
      ...current,
      images: current.images.filter((_, position) => position !== index),
    }))
    clearImageErrors()
    setMessage(null)
  }

  const toggleCategory = (category: string) => {
    setValues((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setServerErrors([])

    const nextErrors = validate(values)
    if (nameMatch) nextErrors.name = DUPLICATE_NAME_MESSAGE
    if (idMatch) nextErrors.id = DUPLICATE_ID_MESSAGE
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setMessage("Please fix the highlighted fields.")
      return
    }

    const payload: Record<string, unknown> = {
      id: values.id.trim(),
      brand: values.brand.trim(),
      name: values.name.trim(),
      fullName: values.fullName.trim(),
      short: values.short.trim(),
      description: values.description.trim(),
      image: values.image.trim(),
      url: values.url.trim(),
      store: values.store,
      categories: values.categories,
      features: values.features
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
      bestseller: values.bestseller,
    }

    const images = values.images.map((image) => image.trim()).filter(Boolean)
    if (images.length > 0) payload.images = images

    if (values.price.trim()) payload.price = values.price.trim()
    if (values.salePrice.trim()) payload.salePrice = values.salePrice.trim()
    if (values.rating.trim()) payload.rating = Number(values.rating)
    if (values.reviewCount.trim()) payload.reviewCount = Number(values.reviewCount)
    if (values.addedDate.trim()) payload.addedDate = values.addedDate.trim()

    const affiliateLinks: Partial<Record<StoreLinkKey, string>> = {}
    for (const key of STORE_LINK_ORDER) {
      const value = values.affiliateLinks[key].trim()
      if (value) affiliateLinks[key] = value
    }
    if (Object.keys(affiliateLinks).length > 0) payload.affiliateLinks = affiliateLinks

    // Always sent, even when empty, so removing every row clears the column.
    payload.storePricing = values.storePricing
      .filter((row) => !isBlankStorePricingRow(row))
      .map((row) => ({
        store: row.store.trim(),
        price: Number(row.price),
        currency: row.currency,
        url: row.url.trim(),
      }))

    if (values.relatedProducts.length > 0) payload.relatedProducts = values.relatedProducts

    setPending(true)
    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${encodeURIComponent(initial?.id ?? values.id.trim())}`

      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        errors?: string[]
        field?: string
        duplicate?: { id: string; brand: string; name: string }
      }

      if (!response.ok) {
        setMessage(data.error ?? "Could not save the product.")
        setServerErrors(data.errors ?? [])

        // Keep 409 uniqueness conflicts attached to the field that caused them,
        // even if this client's product list was stale.
        if (data.field === "name" || data.field === "id") {
          const field = data.field
          setErrors((current) => ({
            ...current,
            [field]:
              data.error ??
              (field === "name" ? DUPLICATE_NAME_MESSAGE : DUPLICATE_ID_MESSAGE),
          }))
        }
        return
      }

      router.push("/admin")
      router.refresh()
    } catch {
      setMessage("Network error while saving the product.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-midnight">
            {mode === "create" ? "Add product" : "Edit product"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Creates a new record in Supabase."
              : `Editing ${initial?.id}. The id cannot be changed.`}
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice"
        >
          Back to products
        </Link>
      </div>

      {message && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p role="alert">{message}</p>
          {serverErrors.length > 0 && (
            <ul className="mt-2 list-inside list-disc">
              {serverErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">Identity</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <TextField
            id="id"
            label="ID (slug)"
            value={values.id}
            onChange={(value) => {
              update("id", value)
              // Typing takes the slug over; clearing it re-enables auto-generation.
              if (mode === "create") setIdEdited(value.trim() !== "")
            }}
            error={idMatch ? undefined : errors.id}
            warning={idMatch ? DUPLICATE_ID_MESSAGE : undefined}
            required
            disabled={mode === "edit"}
            hint={
              idMatch
                ? `Already used by ${idMatch.brand} — ${idMatch.name}.`
                : mode === "edit"
                  ? "Immutable after creation."
                  : idEdited
                    ? "Lowercase, hyphenated, unique."
                    : "Auto-generated from brand + name — edit it to take over."
            }
          />
          <TextField
            id="brand"
            label="Brand"
            value={values.brand}
            onChange={(value) => {
              update("brand", value)
              syncIdFromIdentity({ brand: value })
            }}
            error={errors.brand}
            required
          />
          <TextField
            id="name"
            label="Name"
            value={values.name}
            onChange={(value) => {
              update("name", value)
              syncIdFromIdentity({ name: value })
            }}
            error={nameMatch ? undefined : errors.name}
            warning={nameMatch ? DUPLICATE_NAME_MESSAGE : undefined}
            hint={
              nameMatch
                ? `Already used by ${nameMatch.brand} — ${nameMatch.name} (${nameMatch.id}).`
                : undefined
            }
            required
          />
          <TextField
            id="fullName"
            label="Full name"
            value={values.fullName}
            onChange={(value) => update("fullName", value)}
            error={errors.fullName}
            required
          />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">Content</legend>
        <div className="mt-3 grid gap-4">
          <TextField
            id="short"
            label="Short description"
            value={values.short}
            onChange={(value) => update("short", value)}
            error={errors.short}
            required
            multiline
            rows={2}
          />
          <TextField
            id="description"
            label="Description"
            value={values.description}
            onChange={(value) => update("description", value)}
            error={errors.description}
            required
            multiline
            rows={4}
          />
          <TextField
            id="features"
            label="Features"
            value={values.features}
            onChange={(value) => update("features", value)}
            hint="One feature per line. Empty lists are allowed but produce a validation warning."
            multiline
            rows={4}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="image"
              label="Product Image URL"
              value={values.image}
              onChange={(value) => update("image", value)}
              error={errors.image}
              required
              type="text"
              placeholder="https://m.media-amazon.com/images/…"
              hint="Main image on product cards. Paste an https:// URL or a local /uploads/... path."
            />
            <TextField
              id="url"
              label="Affiliate URL"
              value={values.url}
              onChange={(value) => update("url", value)}
              error={errors.url}
              required
              type="url"
              hint="Primary link. Used when a store-specific link is not provided."
              normalize={(raw) => normalizePrimaryUrl(values.store, raw)}
              onNormalized={() => markAutoFixed("url", primaryNoteForStore(values.store))}
              note={autoFixed.url}
            />
          </div>

          <div className="rounded-xl border border-border bg-white/60 p-4">
            <button
              type="button"
              onClick={() => setImagesExpanded((current) => !current)}
              aria-expanded={imagesExpanded}
              aria-controls="extra-product-images"
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="inline-flex flex-wrap items-center gap-2 text-sm font-semibold text-midnight">
                <Plus className="h-4 w-4 text-glacier" aria-hidden="true" />
                Add extra images
                {values.images.length > 0 && (
                  <span className="rounded-full bg-ice px-2 py-0.5 text-[0.65rem] font-bold text-winter">
                    {values.images.length}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  imagesExpanded ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {imagesExpanded && (
              <div id="extra-product-images" className="mt-3 flex flex-col gap-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Extra images appear after the main photo in the product popup gallery. The
                  main image always stays first.
                </p>

                {values.images.length === 0 ? (
                  <button
                    type="button"
                    onClick={addImage}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Add image
                  </button>
                ) : (
                  <>
                    {values.images.map((image, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border bg-white/70 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-glacier">
                            Image {index + 2}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-destructive underline-offset-2 transition-colors hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Remove
                          </button>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-[5.5rem_1fr]">
                          <div className="aspect-square overflow-hidden rounded-lg border border-border bg-ice">
                            <MediaPreview
                              src={image}
                              alt={`Extra image ${index + 2} preview`}
                              className="h-full w-full object-contain"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <TextField
                              id={`images-${index}`}
                              label={`Image ${index + 2} URL`}
                              value={image}
                              onChange={(value) => updateImage(index, value)}
                              error={errors[`images.${index}`]}
                              placeholder="https://… or /uploads/products/…"
                              hint="Leave this row blank to ignore it."
                            />
                            <div>
                              <MediaUploadButton
                                kind="product"
                                label="Upload image"
                                disabled={pending}
                                onUploaded={(uploaded) =>
                                  updateImage(index, uploaded.url)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={addImage}
                        disabled={values.images.length >= MAX_EXTRA_PRODUCT_IMAGES}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice disabled:opacity-60"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Add another image
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {values.images.length} of {MAX_EXTRA_PRODUCT_IMAGES} extra images
                      </p>
                    </div>
                  </>
                )}

                {errors.images && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.images}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">Store & pricing</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="store"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Store <span aria-hidden="true">*</span>
            </label>
            <select
              id="store"
              name="store"
              value={values.store}
              required
              onChange={(event) => update("store", event.target.value)}
              aria-invalid={errors.store ? true : undefined}
              aria-describedby={errors.store ? "store-error" : undefined}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-midnight outline-none focus-visible:ring-2 focus-visible:ring-glacier"
            >
              {STORE_OPTIONS.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
            {errors.store && (
              <p id="store-error" role="alert" className="text-xs font-medium text-destructive">
                {errors.store}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <TextField
              id="price"
              label="Price (optional)"
              value={values.price}
              onChange={(value) => update("price", value)}
              error={errors.price}
              placeholder="$24.99"
              hint="Include the currency symbol. Displayed with a ~ prefix."
            />
            <TextField
              id="salePrice"
              label="Sale price (optional)"
              value={values.salePrice}
              onChange={(value) => update("salePrice", value)}
              error={errors.salePrice}
              placeholder="$17.50"
              hint="Discounted price. When set, the regular Price is displayed struck through and a -X% badge is shown."
            />
          </div>
          <TextField
            id="rating"
            label="Rating (optional)"
            value={values.rating}
            onChange={(value) => update("rating", value)}
            error={errors.rating}
            type="number"
            step="0.1"
            min="1"
            max="5"
            placeholder="4.5"
          />
          <TextField
            id="reviewCount"
            label="Review count (optional)"
            value={values.reviewCount}
            onChange={(value) => update("reviewCount", value)}
            error={errors.reviewCount}
            type="number"
            step="1"
            min="0"
            placeholder="14513"
          />
          <TextField
            id="addedDate"
            label="Added date"
            value={values.addedDate}
            onChange={(value) => update("addedDate", value)}
            error={errors.addedDate}
            type="date"
            hint="Defaults to today. Stored as a full date; the table shows month and year."
          />
        </div>

        <fieldset className="mt-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Categories <span aria-hidden="true">*</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {CATEGORY_OPTIONS.map((category) => (
              <label key={category} className="flex items-center gap-2 text-sm text-midnight">
                <input
                  type="checkbox"
                  name="categories"
                  value={category}
                  checked={values.categories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="h-4 w-4 rounded border-border text-winter focus-visible:ring-2 focus-visible:ring-glacier"
                />
                {category}
              </label>
            ))}
          </div>
          {errors.categories && (
            <p role="alert" className="mt-2 text-xs font-medium text-destructive">
              {errors.categories}
            </p>
          )}
        </fieldset>

        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-midnight">
          <input
            type="checkbox"
            name="bestseller"
            checked={values.bestseller}
            onChange={(event) => update("bestseller", event.target.checked)}
            className="h-4 w-4 rounded border-border text-winter focus-visible:ring-2 focus-visible:ring-glacier"
          />
          Bestseller
        </label>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">Store Pricing</legend>
        <p className="mt-2 text-xs text-muted-foreground">
          Optional per-store prices shown in the &ldquo;Compare prices&rdquo; dialog on product
          cards. The Store &amp; pricing fields above stay the primary/default store.
        </p>

        <div className="mt-3 flex flex-col gap-3">
          {values.storePricing.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-white/60 px-4 py-3 text-xs text-muted-foreground">
              No comparison prices yet. Add a store to show the Compare prices button.
            </p>
          ) : (
            values.storePricing.map((row, index) => {
              const field = `storePricing.${index}`
              const rowKey = storeLinkKeyForName(row.store)
              const currencyOptions = CURRENCY_OPTIONS.includes(row.currency)
                ? CURRENCY_OPTIONS
                : [row.currency, ...CURRENCY_OPTIONS]

              return (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-white/70 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-glacier">
                      Store {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeStorePricing(index)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-destructive underline-offset-2 transition-colors hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <TextField
                      id={`storePricing-${index}-store`}
                      label="Store name"
                      value={row.store}
                      onChange={(value) => updateStorePricing(index, "store", value)}
                      error={errors[`${field}.store`]}
                      placeholder="Amazon US"
                    />
                    <TextField
                      id={`storePricing-${index}-price`}
                      label="Price"
                      value={row.price}
                      onChange={(value) => updateStorePricing(index, "price", value)}
                      error={errors[`${field}.price`]}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="24.99"
                    />
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`storePricing-${index}-currency`}
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        Currency
                      </label>
                      <select
                        id={`storePricing-${index}-currency`}
                        name={`storePricing-${index}-currency`}
                        value={row.currency}
                        onChange={(event) =>
                          updateStorePricing(index, "currency", event.target.value)
                        }
                        aria-invalid={errors[`${field}.currency`] ? true : undefined}
                        aria-describedby={
                          errors[`${field}.currency`]
                            ? `storePricing-${index}-currency-error`
                            : undefined
                        }
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-midnight outline-none focus-visible:ring-2 focus-visible:ring-glacier"
                      >
                        {currencyOptions.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                      {errors[`${field}.currency`] && (
                        <p
                          id={`storePricing-${index}-currency-error`}
                          role="alert"
                          className="text-xs font-medium text-destructive"
                        >
                          {errors[`${field}.currency`]}
                        </p>
                      )}
                    </div>
                    <TextField
                      id={`storePricing-${index}-url`}
                      label="Affiliate URL"
                      value={row.url}
                      onChange={(value) => updateStorePricing(index, "url", value)}
                      error={errors[`${field}.url`]}
                      type="url"
                      placeholder="https://www.amazon.com/dp/…"
                      normalize={rowKey ? (raw) => normalizeAffiliateValue(rowKey, raw) : undefined}
                      onNormalized={
                        rowKey
                          ? () => markAutoFixed(`${field}.url`, noteForStoreKey(rowKey))
                          : undefined
                      }
                      note={autoFixed[`${field}.url`]}
                    />
                  </div>
                </div>
              )
            })
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addStorePricing}
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add Store
              </button>
              <button
                type="button"
                onClick={addPrimaryStorePricing}
                disabled={primaryPrefillReason !== null}
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-winter transition-colors hover:bg-ice disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add primary store to Compare prices
              </button>
            </div>
            {primaryPrefillReason && (
              <p className="text-xs text-muted-foreground">{primaryPrefillReason}</p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">Affiliate Links</legend>
        <p className="mt-2 text-xs text-muted-foreground">
          Fill any stores where this product is available.
        </p>
        <div className="mt-3 grid gap-4">
          {STORE_LINK_ORDER.map((key) => (
            <TextField
              key={key}
              id={`affiliateLinks.${key}`}
              label={`${STORE_LINK_META[key].label} URL (optional)`}
              value={values.affiliateLinks[key]}
              onChange={(value) => updateAffiliateLink(key, value)}
              error={errors[`affiliateLinks.${key}`]}
              type="url"
              placeholder={
                key === "amazonUs"
                  ? "https://www.amazon.com/dp/…?tag=beautynest202-20"
                  : key === "amazonUk"
                    ? "https://www.amazon.co.uk/dp/…?tag=beautynestkor-21"
                    : "https://www.stylevana.com/…?ref=frostdew"
              }
              hint={
                key === "stylevana"
                  ? "Use a stylevana.com link with ref=frostdew or an Awin link."
                  : "The store tag is enforced when you save."
              }
              normalize={(raw) => normalizeAffiliateValue(key, raw)}
              onNormalized={() => markAutoFixed(`affiliateLinks.${key}`, noteForStoreKey(key))}
              note={autoFixed[`affiliateLinks.${key}`]}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-sm font-bold text-midnight">Related products</legend>
        <p className="mt-2 text-xs text-muted-foreground">
          Choose products to show under &ldquo;You may also like&rdquo;. The first six are displayed.
        </p>
        <div className="mt-3">
          <RelatedProductsPicker
            options={productOptions}
            currentId={values.id.trim()}
            selected={values.relatedProducts}
            onChange={(ids) => update("relatedProducts", ids)}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || saveBlocked}
          aria-describedby={saveBlocked ? "save-blocked-reason" : undefined}
          className="inline-flex items-center justify-center rounded-full bg-amber-cta px-5 py-2.5 text-sm font-bold text-midnight transition-colors hover:bg-amber-cta/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        {saveBlocked && (
          <p id="save-blocked-reason" role="status" className="text-xs font-semibold text-amber-800">
            {nameMatch || errors.name === DUPLICATE_NAME_MESSAGE
              ? "Change the brand or name to save."
              : "Resolve the duplicate ID to save."}
          </p>
        )}
        <Link href="/admin" className="text-sm font-semibold text-winter underline-offset-4 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
