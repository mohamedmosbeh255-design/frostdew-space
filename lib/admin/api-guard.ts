import { NextResponse } from "next/server"
import {
  adminFeatureEnabled,
  adminWritesEnabled,
  isAdminAuthenticated,
  isSameOrigin,
} from "./auth"

/** Returns a response when the caller may not read admin data, otherwise null. */
export async function guardRead(): Promise<NextResponse | null> {
  if (!adminFeatureEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

/** Returns a response when the caller may not mutate data, otherwise null. */
export async function guardWrite(request: Request): Promise<NextResponse | null> {
  const denied = await guardRead()
  if (denied) return denied

  if (!adminWritesEnabled()) {
    return NextResponse.json(
      {
        error:
          "Writes are disabled in this environment. Set ADMIN_ALLOW_WRITES=true or connect a real backend (see docs/admin.md).",
      },
      { status: 501 },
    )
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin writes are not allowed." }, { status: 403 })
  }

  return null
}
