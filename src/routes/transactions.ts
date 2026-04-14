import { Hono } from "hono"
import { z } from "zod"
import { CreateTransactionSchema, UpdateTransactionSchema } from "@/schemas/transaction"
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  NotFoundError,
} from "@/services/transactions"
import { updateTransaction } from "@/services/transactions"
import { requireAuthenticatedUserId, getSessionUser } from "@/lib/auth-helpers"

export const router = new Hono()

router.get("/", async (c) => {
  try {
    const user = await getSessionUser(c)
    if (!user) {
      console.log("[GET /transactions] No session found, returning 401")
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = user.id
    const month = c.req.query("month")
    const transactions = await listTransactions(userId, month)
    return c.json({ data: transactions })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error listing transactions:", error)
    return c.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})

router.post("/", async (c) => {
  try {
    console.log("[POST /transactions] Entry point - checking session")
    const user = await getSessionUser(c)
    if (!user) {
      console.log("[POST /transactions] No session found, returning 401")
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[POST /transactions] Session found for user:", user.email)
    
    const userId = user.id
    const body = await c.req.json()

    const result = CreateTransactionSchema.safeParse(body)

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join(".")
        if (!fieldErrors[path]) {
          fieldErrors[path] = []
        }
        fieldErrors[path].push(issue.message)
      }

      return c.json(
        {
          error: "Validation failed",
          details: { fieldErrors },
        },
        { status: 422 }
      )
    }

    const transaction = await createTransaction(result.data, userId)
    return c.json({ data: transaction }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error creating transaction:", error)
    return c.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})

router.get("/:id", async (c) => {
  try {
    const userId = requireAuthenticatedUserId(c)
    const id = c.req.param("id")
    const transaction = await getTransaction(id, userId)
    return c.json({ data: transaction })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error getting transaction:", error)
    return c.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})

router.put("/:id", async (c) => {
  try {
    const userId = requireAuthenticatedUserId(c)
    const id = c.req.param("id")
    const body = await c.req.json()

    const result = UpdateTransactionSchema.safeParse(body)

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join(".")
        if (!fieldErrors[path]) {
          fieldErrors[path] = []
        }
        fieldErrors[path].push(issue.message)
      }

      return c.json(
        {
          error: "Validation failed",
          details: { fieldErrors },
        },
        { status: 422 }
      )
    }

    const transaction = await updateTransaction(id, userId, result.data)
    return c.json({ data: transaction })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error updating transaction:", error)
    return c.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})

router.delete("/:id", async (c) => {
  try {
    const userId = requireAuthenticatedUserId(c)
    const id = c.req.param("id")
    await deleteTransaction(id, userId)
    return c.body(null, { status: 204 })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error deleting transaction:", error)
    return c.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})
