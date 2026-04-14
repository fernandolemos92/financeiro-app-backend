import type { Goal, GoalContribution } from "@/types/goal"
import { createSupabaseClient } from "@/db/client"
import type { CreateGoalInput, UpdateGoalInput } from "@/schemas/goal"

function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    name: row.name as string,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    deadline: row.deadline as string,
    status: row.status as "active" | "completed" | "manually_closed",
    createdAt: new Date(row.created_at as string).toISOString(),
    completedAt: row.completed_at
      ? new Date(row.completed_at as string).toISOString()
      : undefined,
    contributions: (row.contributions as GoalContribution[] | null) || [],
    user_id: row.user_id as string | undefined,
  }
}

export async function dbFindAll(userId: string): Promise<Goal[]> {
  const client = createSupabaseClient()
  const { data, error } = await client
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`)
  }

  return (data || []).map(rowToGoal)
}

export async function dbFindById(id: string, userId: string): Promise<Goal | null> {
  const client = createSupabaseClient()
  const { data, error } = await client
    .from("goals")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to fetch goal: ${error.message}`)
  }

  return data ? rowToGoal(data) : null
}

export async function dbCreate(input: CreateGoalInput, userId: string): Promise<Goal> {
  const client = createSupabaseClient()

  const insertData = {
    name: input.name,
    target_amount: input.targetAmount,
    current_amount: 0,
    deadline: input.deadline,
    status: "active",
    contributions: [],
    user_id: userId,
  }

  const { data, error } = await client
    .from("goals")
    .insert([insertData])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`)
  }

  return rowToGoal(data)
}

export async function dbUpdate(
  id: string,
  userId: string,
  input: UpdateGoalInput
): Promise<Goal | null> {
  const client = createSupabaseClient()

  const updateData: Record<string, unknown> = {}

  if (input.name !== undefined) updateData.name = input.name
  if (input.targetAmount !== undefined)
    updateData.target_amount = input.targetAmount
  if (input.deadline !== undefined) updateData.deadline = input.deadline

  const { data, error } = await client
    .from("goals")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to update goal: ${error.message}`)
  }

  return data ? rowToGoal(data) : null
}

export async function dbDelete(id: string, userId: string): Promise<boolean> {
  const client = createSupabaseClient()

  // First, verify the record exists AND belongs to the user
  const { data: existingRecord } = await client
    .from("goals")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  // If record doesn't exist or doesn't belong to user, return false
  if (!existingRecord) {
    return false
  }

  const { error } = await client
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`)
  }

  return true
}

export async function dbAddContribution(
  id: string,
  userId: string,
  contribution: GoalContribution,
  newCurrentAmount: number,
  newStatus: string,
  newCompletedAt: string | null
): Promise<Goal | null> {
  const client = createSupabaseClient()

  // First get current contributions
  const { data: goalData, error: fetchError } = await client
    .from("goals")
    .select("contributions")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to fetch goal: ${fetchError.message}`)
  }

  const currentContributions = (goalData.contributions as unknown[] | null) || []
  const updatedContributions = [...currentContributions, contribution]

  const updateData: Record<string, unknown> = {
    contributions: updatedContributions,
    current_amount: newCurrentAmount,
    status: newStatus,
  }

  if (newCompletedAt) {
    updateData.completed_at = newCompletedAt
  }

  const { data, error } = await client
    .from("goals")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to update goal: ${error.message}`)
  }

  return data ? rowToGoal(data) : null
}

export async function dbUpdateStatus(
  id: string,
  userId: string,
  status: string,
  completedAt?: string
): Promise<Goal | null> {
  const client = createSupabaseClient()

  const updateData: Record<string, unknown> = {
    status,
  }

  if (completedAt) {
    updateData.completed_at = completedAt
  }

  const { data, error } = await client
    .from("goals")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to update goal: ${error.message}`)
  }

  return data ? rowToGoal(data) : null
}
