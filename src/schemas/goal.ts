import { z } from "zod"

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const CreateGoalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().positive("Target amount must be greater than 0"),
  deadline: z
    .string()
    .regex(dateRegex, "Deadline must be in YYYY-MM-DD format"),
})

export const UpdateGoalSchema = CreateGoalSchema.partial()

export const AddContributionSchema = z.object({
  amount: z.number().positive("Contribution must be positive"),
})

export type CreateGoalInput = z.infer<typeof CreateGoalSchema>
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>
export type AddContributionInput = z.infer<typeof AddContributionSchema>
