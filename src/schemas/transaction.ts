import { z } from "zod"

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const CreateTransactionSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    amount: z.number().positive("Amount must be greater than 0"),
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().optional(),
    description: z.string().optional(),
    date: z
      .string()
      .regex(dateRegex, "Date must be in YYYY-MM-DD format"),
    income_type: z
      .enum(["fixed", "variable", "oscillating"])
      .optional(),
    expense_nature: z
      .enum(["debt", "cost_of_living", "pleasure", "application"])
      .optional(),
    frequency: z
      .enum(["monthly", "annual", "occasional"])
      .optional(),
    planning_status: z
      .enum(["planned", "realized"])
      .optional()
      .default("realized"),
    installment_total: z.number().int().min(1).max(360).optional(),
    installment_number: z.number().int().min(1).optional(),
    purchase_total_amount: z.number().positive().optional(),
    installment_group_id: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "income") {
      if (!data.income_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["income_type"],
          message: "income_type is required for income transactions",
        })
      }
      if (data.expense_nature !== undefined && data.expense_nature !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expense_nature"],
          message: "expense_nature must not be set for income transactions",
        })
      }
    }

    if (data.type === "expense") {
      if (!data.expense_nature) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expense_nature"],
          message: "expense_nature is required for expense transactions",
        })
      }
      if (data.income_type !== undefined && data.income_type !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["income_type"],
          message: "income_type must not be set for expense transactions",
        })
      }
    }

    // Installment validation
    if (data.installment_total !== undefined && data.installment_total > 1) {
      if (!data.purchase_total_amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["purchase_total_amount"],
          message: "purchase_total_amount is required when installment_total > 1",
        })
      }
    }
    if (data.installment_total !== undefined && data.installment_number !== undefined) {
      if (data.installment_number > data.installment_total) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["installment_number"],
          message: "installment_number cannot be greater than installment_total",
        })
      }
    }
    if (data.installment_number !== undefined && data.installment_total === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installment_total"],
        message: "installment_total is required when installment_number is set",
      })
    }
  })

export const UpdateTransactionSchema = z
  .object({
    type: z.enum(["income", "expense"]).optional(),
    amount: z.number().positive("Amount must be greater than 0").optional(),
    category: z.string().min(1, "Category is required").optional(),
    subcategory: z.string().optional(),
    description: z.string().optional(),
    date: z
      .string()
      .regex(dateRegex, "Date must be in YYYY-MM-DD format")
      .optional(),
    income_type: z
      .enum(["fixed", "variable", "oscillating"])
      .optional(),
    expense_nature: z
      .enum(["debt", "cost_of_living", "pleasure", "application"])
      .optional(),
    frequency: z
      .enum(["monthly", "annual", "occasional"])
      .optional(),
    planning_status: z
      .enum(["planned", "realized"])
      .optional(),
    installment_total: z.number().int().min(1).max(360).optional(),
    installment_number: z.number().int().min(1).optional(),
    purchase_total_amount: z.number().positive().optional(),
    installment_group_id: z.string().uuid().optional(),
  })
  .superRefine((data: any, ctx: any) => {
    if (data.installment_total !== undefined && data.installment_number !== undefined) {
      if (data.installment_number > data.installment_total) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["installment_number"],
          message: "installment_number cannot be greater than installment_total",
        })
      }
    }
    if (data.installment_number !== undefined && data.installment_total === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installment_total"],
        message: "installment_total is required when installment_number is set",
      })
    }
    if (data.type === "income") {
      if (!data.income_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["income_type"],
          message: "income_type is required when type is income",
        })
      }
      if (data.expense_nature !== undefined && data.expense_nature !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expense_nature"],
          message: "expense_nature must not be set for income transactions",
        })
      }
    }

    if (data.type === "expense") {
      if (!data.expense_nature) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expense_nature"],
          message: "expense_nature is required when type is expense",
        })
      }
      if (data.income_type !== undefined && data.income_type !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["income_type"],
          message: "income_type must not be set for expense transactions",
        })
      }
    }
  })

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>
