export type TransactionType = "income" | "expense"

export type IncomeType = "fixed" | "variable" | "oscillating"
export type ExpenseNature = "debt" | "cost_of_living" | "pleasure" | "application"
export type Frequency = "monthly" | "annual" | "occasional"
export type PlanningStatus = "planned" | "realized"

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  subcategory?: string
  description?: string
  date: string
  createdAt: string
  income_type?: IncomeType
  expense_nature?: ExpenseNature
  frequency?: Frequency
  planning_status?: PlanningStatus
  installment_total?: number
  installment_number?: number
  purchase_total_amount?: number
  installment_group_id?: string
  user_id: string
}
