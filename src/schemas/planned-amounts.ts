import { z } from "zod"

export const UpsertPlannedAmountsSchema = z
  .object({
    debt: z.number().nonnegative().optional(),
    cost_of_living: z.number().nonnegative().optional(),
    pleasure: z.number().nonnegative().optional(),
    application: z.number().nonnegative().optional(),
  })
  .refine(
    (data) =>
      data.debt !== undefined ||
      data.cost_of_living !== undefined ||
      data.pleasure !== undefined ||
      data.application !== undefined,
    {
      message: "At least one field must be provided",
    }
  )

export const MonthParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM")

export type UpsertPlannedAmountsInput = z.infer<typeof UpsertPlannedAmountsSchema>
