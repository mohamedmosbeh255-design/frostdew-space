"use client"

import { type FormEvent, useState } from "react"
import { Send } from "lucide-react"
import { CONTACT_EMAIL } from "@/lib/site"

const fieldClass =
  "h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm text-midnight placeholder:text-muted-foreground focus-visible:outline-2"

export default function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const subject = `FrostDew enquiry${name.trim() ? ` from ${name.trim()}` : ""}`
    const body = [
      `Name: ${name.trim() || "Not provided"}`,
      `Email: ${email.trim() || "Not provided"}`,
      "",
      message.trim(),
    ].join("\n")

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-name" className="text-xs font-bold uppercase tracking-[0.15em] text-winter">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-[0.15em] text-winter">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-[0.15em] text-winter">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell us what you need help with."
          className="w-full resize-y rounded-xl border border-input bg-white px-3.5 py-3 text-sm leading-relaxed text-midnight placeholder:text-muted-foreground focus-visible:outline-2"
        />
      </div>

      <button
        type="submit"
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-amber-cta px-6 py-3 text-sm font-bold text-midnight transition-colors hover:bg-[#f0b252] focus-visible:outline-2"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        Open in email app
      </button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        This form has no backend. Submitting it opens your email app with the message prefilled —
        nothing is sent to or stored on this site.
      </p>
    </form>
  )
}
