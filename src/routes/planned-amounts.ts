import { Hono } from "hono"
import { z } from "zod"
import {
  UpsertPlannedAmountsSchema,
  MonthParamSchema,
} from "@/schemas/planned-amounts"
import {
  getPlannedAmountsByMonth,
  upsertPlannedAmounts,
} from "@/services/planned-amounts"

export const router = new Hono()

router.get("/", async (c) => {
  try {
    const month = c.req.query("month")

    if (!month) {
      return c.json(
        { error: "Month parameter is required" },
        { status: 400 }
      )
    }

    const monthValidation = MonthParamSchema.safeParse(month)
    if (!monthValidation.success) {
      return c.json(
        { error: "Month must be in YYYY-MM format" },
        { status: 400 }
      )
    }

    const plannedAmounts = await getPlannedAmountsByMonth(month)
    return c.json({ data: plannedAmounts })
  } catch (error) {
    console.error("Error getting planned amounts:", error)
    return c.json({ error: "Internal server error" }, { status: 500 })
  }
})

router.put("/:month", async (c) => {
  try {
    const month = c.req.param("month")

    const monthValidation = MonthParamSchema.safeParse(month)
    if (!monthValidation.success) {
      return c.json(
        { error: "Month must be in YYYY-MM format" },
        { status: 400 }
      )
    }

    const body = await c.req.json()

    const result = UpsertPlannedAmountsSchema.safeParse(body)

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

    const plannedAmounts = await upsertPlannedAmounts(month, result.data)
    return c.json({ data: plannedAmounts })
  } catch (error) {
    console.error("Error upserting planned amounts:", error)
    return c.json({ error: "Internal server error" }, { status: 500 })
  }
})
