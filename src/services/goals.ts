import { randomUUID } from "crypto"
import type { Goal } from "@/types/goal"
import type { CreateGoalInput, UpdateGoalInput, AddContributionInput } from "@/schemas/goal"
import {
  dbCreate,
  dbDelete,
  dbFindAll,
  dbFindById,
  dbUpdate,
  dbAddContribution,
  dbUpdateStatus,
} from "@/repositories/goals"

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConflictError"
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ForbiddenError"
  }
}

export async function listGoals(userId: string): Promise<Goal[]> {
  return dbFindAll(userId)
}

export async function getGoal(id: string, userId: string): Promise<Goal> {
  const goal = await dbFindById(id, userId)

  if (!goal) {
    throw new NotFoundError(`Goal not found: ${id}`)
  }

  return goal
}

export async function createGoal(input: CreateGoalInput, userId: string): Promise<Goal> {
  return dbCreate(input, userId)
}

export async function updateGoal(
  id: string,
  userId: string,
  input: UpdateGoalInput
): Promise<Goal> {
  const goal = await dbUpdate(id, userId, input)

  if (!goal) {
    throw new NotFoundError(`Goal not found: ${id}`)
  }

  // Recheck auto-completion if targetAmount changed
  if (input.targetAmount && goal.currentAmount >= goal.targetAmount) {
    if (goal.status === "active") {
      const now = new Date().toISOString()
      const updated = await dbUpdateStatus(id, userId, "completed", now)
      if (!updated) {
        throw new NotFoundError(`Goal not found: ${id}`)
      }
      return updated
    }
  }

  return goal
}

export async function deleteGoal(id: string, userId: string): Promise<void> {
  const deleted = await dbDelete(id, userId)

  if (!deleted) {
    throw new ForbiddenError(`Goal not found or access denied: ${id}`)
  }
}

export async function addContribution(
  goalId: string,
  userId: string,
  input: AddContributionInput
): Promise<Goal> {
  const goal = await getGoal(goalId, userId)

  const newCurrentAmount = goal.currentAmount + input.amount
  const newContribution = {
    id: randomUUID(),
    amount: input.amount,
    date: new Date().toISOString(),
  }

  const newStatus =
    newCurrentAmount >= goal.targetAmount ? "completed" : goal.status
  const newCompletedAt =
    newStatus === "completed" ? new Date().toISOString() : goal.completedAt || null

  const updated = await dbAddContribution(
    goalId,
    userId,
    newContribution,
    newCurrentAmount,
    newStatus,
    newCompletedAt
  )

  if (!updated) {
    throw new NotFoundError(`Goal not found: ${goalId}`)
  }

  return updated
}

export async function closeGoalManually(id: string, userId: string): Promise<Goal> {
  const goal = await getGoal(id, userId)

  if (goal.status !== "active") {
    throw new ConflictError("Goal is already closed")
  }

  const updated = await dbUpdateStatus(id, userId, "manually_closed", new Date().toISOString())

  if (!updated) {
    throw new NotFoundError(`Goal not found: ${id}`)
  }

  return updated
}
