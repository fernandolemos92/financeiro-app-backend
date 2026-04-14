import { Hono } from "hono"
import { auth } from "../auth"
import { z } from "zod"

export const authRouter = new Hono()

const seedUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

authRouter.post("/seed", async (c) => {
  const body = await c.req.json()
  const result = seedUserSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: "Invalid input" }, 400)
  }

  const { email, password, name } = result.data

  try {
    const req = new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name: name || "Developer",
      }),
    })

    const res = await auth.handler(req)
    const data = await res.json()

    if (!res.ok) {
      return c.json({ error: data.error || "Failed to create user" }, 400)
    }

    return c.json({ user: data.user, message: "User created" })
  } catch (err) {
    return c.json({ error: "Failed to create user" }, 500)
  }
})

authRouter.get("/session", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json({ error: "Not authenticated" }, 401)
  }

  return c.json({ session: session.session, user: session.user })
})