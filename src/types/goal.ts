export type GoalStatus = "active" | "completed" | "manually_closed"

export interface GoalContribution {
  id: string
  amount: number
  date: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  status: GoalStatus
  createdAt: string
  completedAt?: string
  contributions: GoalContribution[]
  user_id?: string
}
