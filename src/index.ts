import "dotenv/config"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "@hono/node-server"
import { router as transactionRouter } from "@/routes/transactions"
import { router as goalsRouter } from "@/routes/goals"
import { router as plannedAmountsRouter } from "@/routes/planned-amounts"
import { authRouter } from "@/routes/auth"
import { auth } from "@/auth"

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

// CORS configurável via variável de ambiente
const corsOrigin = process.env.CORS_ORIGIN || process.env.APP_URL || "http://localhost:3000"

app.use(
  "*",
  cors({
    origin: corsOrigin,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
  })
)

app.on(["POST", "GET", "DELETE"], "/api/auth/*", (c) => auth.handler(c.req.raw))

app.use("/api/*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    c.set("user", null)
    c.set("session", null)
  } else {
    c.set("user", session.user)
    c.set("session", session.session)
  }
  await next()
})

// Middleware para todas as rotas que precisam de autenticação
const authMiddleware = async (c: any, next: any) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    c.set("user", null)
    c.set("session", null)
  } else {
    c.set("user", session.user)
    c.set("session", session.session)
  }
  await next()
}

// Aplicar para todos os métodos em todas as rotas de API
app.on(["GET", "POST", "PUT", "DELETE"], "/transactions/*", authMiddleware)
app.on(["GET", "POST", "PUT", "DELETE"], "/goals/*", authMiddleware)
app.on(["GET", "POST", "PUT", "DELETE"], "/planned-amounts/*", authMiddleware)

app.route("/transactions", transactionRouter)
app.route("/goals", goalsRouter)
app.route("/planned-amounts", plannedAmountsRouter)
app.route("/auth", authRouter)

const port = Number(process.env.PORT || 3001)

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`)
  }
)