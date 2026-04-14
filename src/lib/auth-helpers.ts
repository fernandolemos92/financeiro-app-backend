import type { Context } from "hono"
import { auth } from "../auth"

export function getAuthenticatedUserId(c: Context): string | null {
  const user = c.get("user")
  return user?.id ?? null
}

export function requireAuthenticatedUserId(c: Context): string {
  const userId = getAuthenticatedUserId(c)
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

export async function getSessionUser(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  return session?.user ?? null
}