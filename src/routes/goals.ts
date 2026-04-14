import { Hono } from "hono"
import { AddContributionSchema, CreateGoalSchema, UpdateGoalSchema } from "@/schemas/goal"
import {
  addContribution,
  closeGoalManually,
  ConflictError,
  ForbiddenError,
  createGoal,
  deleteGoal,
  getGoal,
  listGoals,
  NotFoundError,
  updateGoal,
} from "@/services/goals"
import { requireAuthenticatedUserId, getSessionUser } from "@/lib/auth-helpers"

export const router = new Hono()

router.get("/", async (c) => {
  try {
    const user = await getSessionUser(c)
    if (!user) {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    const goals = await listGoals(user.id)
    return c.json({ data: goals })
  } catch (error) {
    console.error("Error listing goals:", error)
    return c.json({ error: "Internal server error" }, { status: 500 })
  }
})

router.post("/", async (c) => {
  try {
    const user = await getSessionUser(c)
    if (!user) {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await c.req.json()

    const result = CreateGoalSchema.safeParse(body)

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

    const goal = await createGoal(result.data, user.id)
    return c.json({ data: goal }, { status: 201 })
  } catch (error) {
    console.error("Error creating goal:", error)
    return c.json({ error: "Internal server error" }, { status: 500 })
  }
})

router.get("/:id", async (c) => {
  try {
    const user = await getSessionUser(c)
    if (!user) {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    const id = c.req.param("id")
    const goal = await getGoal(id, user.id)
    return c.json({ data: goal })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, { status: 404 })
    }
    console.error("Error getting goal:", error)
    return c.json({ error: "Internal server error" }, { status: 500 })
  }
})

router.put("/:id", async (c) => {
  try {
    const user = await getSessionUser(c)
    if (!user) {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    const id = c.req.param("id")
    const body = await c.req.json()

    const result = UpdateGoalSchema.safeParse(body)

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

    const goal = await updateGoal(id, user.id, result.data)
    return c.json({ data: goal })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, { status: 404 })
    }
    console.error("Error updating goal:", error)
    return c.json({ error: "Internal server error" }, { status: 500 })
  }
})

router.delete("/:id", async (c) => {
  try {
    const user = await getSessionUser(c)
    if (!user) {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    const id = c.req.param("id")
    await deleteGoal(id, user.id)
    return c.body(null, { status: 204 })
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return c.json({ error: error.message }, { status: 404 })
    }
    console.error("Error deleting goal:", error)
    return c.json({ error: "Internal server error" }, { status: 500 })
  }
})

router.post("/:id/contributions", async (c) => {
  try {
    const user = await getSessionUser(c)
    if (!user) {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    const id = c.req.param("id")
    const body = await c.req.json()

    const result = AddContributionSchema.safeParse(body)

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

    const goal = await addContribution(id, user.id, result.data)
    return c.json({ data: goal })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, { status: 404 })
    }
    console.error("Error adding contribution:", error)
    return c.json({ error: "Internal server error" }, { status: 500 })
  }
})

router.post("/:id/close", async (c) => {
  try {
    const user = await getSessionUser(c)
    if (!user) {
      return c.json({ error: "Unauthorized" }, { status: 401 })
    }
    const id = c.req.param("id")
    const goal = await closeGoalManually(id, user.id)
    return c.json({ data: goal })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof ConflictError) {
      return c.json({ error: error.message }, { status: 409 })
    }
    console.error("Error closing goal:", error)
    return c.json({ error: "Internal server error" }, { status: 500 })
  }
})
