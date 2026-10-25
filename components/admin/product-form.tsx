"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ADDED_DATE_PATTERN, ALLOWED_CATEGORIES, ALLOWED_STORES, PRICE_PATTERN } from "@/lib/product-rules.mjs"
import type { Product } from "@/lib/products"

type Mode = "create" | "edit"

type FormState = {
  id: string
  brand: string
  name: string
  fullName: string
  short: string
  description: string
  image: string
  url: string
  store: string
  categories: string[]
  features: string
  bestseller: boolean
  price: string
  rating: string
  reviewCount: string
  addedDate: string
}

const CATEGORY_OPTIONS = [...ALLOWED_CATEGORIES].sort()
const STORE_OPTIONS = [...ALLOWED_STORES]

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
  url: product?.url ?? "",
  store: product?.store ?? "Amazon",
  categories: product?.categories ?? [],
  features: product?.features.join("\n") ?? "",
  bestseller: product?.bestseller ?? false,
  price: product?.price ?? "",
  rating: product?.rating !== undefined ? String(product.rating) : "",
  reviewCount: product?.reviewCount !== undefined ? String(product.reviewCount) : "",
  addedDate: product?.addedDate ?? "",
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
  else if (!isHttps(values.image.trim())) errors.image = "Enter an https image URL."

  if (!values.url.trim()) errors.url = "This field is required."
  else if (!isHttps(values.url.trim())) errors.url = "Enter an https product URL."

  if (!values.store) errors.store = "Choose a store."
  if (values.categories.length === 0) errors.categories = "Select at least one category."

  if (values.price.trim() && !PRICE_PATTERN.test(values.price.trim())) {
    errors.price = 'Use a currency symbol and amount, e.g. "$24.99" or "£19.99".'
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

  return errors
}

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
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
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
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
}: TextFieldProps) {
  const shared = {
    id,
    name: id,
    value,
    required,
    disabled,
    placeholder,
    autoComplete,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
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
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default function ProductForm({ mode, initial }: { mode: Mode; initial?: Product }) {
  const router = useRouter()
  const [values, setValues] = useState<FormState>(() => toInitialState(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
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

    if (values.price.trim()) payload.price = values.price.trim()
    if (values.rating.trim()) payload.rating = Number(values.rating)
    if (values.reviewCount.trim()) payload.reviewCount = Number(values.reviewCount)
    if (values.addedDate.trim()) payload.addedDate = values.addedDate.trim()

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
      }

      if (!response.ok) {
        setMessage(data.error ?? "Could not save the product.")
        setServerErrors(data.errors ?? [])
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
              ? "Creates a new record in data/products.json."
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
            onChange={(value) => update("id", value)}
            error={errors.id}
            required
            disabled={mode === "edit"}
            hint={mode === "edit" ? "Immutable after creation." : "Lowercase, hyphenated, unique."}
          />
          <TextField
            id="brand"
            label="Brand"
            value={values.brand}
            onChange={(value) => update("brand", value)}
            error={errors.brand}
            required
          />
          <TextField
            id="name"
            label="Name"
            value={values.name}
            onChange={(value) => update("name", value)}
            error={errors.name}
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
              label="Image URL"
              value={values.image}
              onChange={(value) => update("image", value)}
              error={errors.image}
              required
              type="url"
              placeholder="https://m.media-amazon.com/images/…"
            />
            <TextField
              id="url"
              label="Affiliate URL"
              value={values.url}
              onChange={(value) => update("url", value)}
              error={errors.url}
              required
              type="url"
              hint="Store tags are enforced by the validator on save."
            />
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
            label="Added date (optional)"
            value={values.addedDate}
            onChange={(value) => update("addedDate", value)}
            error={errors.addedDate}
            type="date"
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-amber-cta px-5 py-2.5 text-sm font-bold text-midnight transition-colors hover:bg-[#f0b252] disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        <Link href="/admin" className="text-sm font-semibold text-winter underline-offset-4 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
