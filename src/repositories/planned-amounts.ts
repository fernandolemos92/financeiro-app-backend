import type { PlannedAmounts } from "@/types/planned-amounts"
import { createSupabaseClient } from "@/db/client"
import type { UpsertPlannedAmountsInput } from "@/schemas/planned-amounts"

function rowToPlannedAmounts(row: Record<string, unknown>): PlannedAmounts {
  return {
    month: row.month as string,
    debt: Number(row.debt),
    cost_of_living: Number(row.cost_of_living),
    pleasure: Number(row.pleasure),
    application: Number(row.application),
  }
}

export async function dbFindByMonth(
  month: string
): Promise<PlannedAmounts | null> {
  const client = createSupabaseClient()
  const { data, error } = await client
    .from("planned_amounts")
    .select("*")
    .eq("month", month)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to fetch planned amounts: ${error.message}`)
  }

  return data ? rowToPlannedAmounts(data) : null
}

export async function dbUpsert(
  month: string,
  input: UpsertPlannedAmountsInput
): Promise<PlannedAmounts> {
  const client = createSupabaseClient()

  const upsertData = {
    month,
    debt: input.debt ?? 0,
    cost_of_living: input.cost_of_living ?? 0,
    pleasure: input.pleasure ?? 0,
    application: input.application ?? 0,
  }

  const { data, error } = await client
    .from("planned_amounts")
    .upsert(upsertData, { onConflict: "month" })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to upsert planned amounts: ${error.message}`)
  }

  return rowToPlannedAmounts(data)
}

export async function dbDeleteByMonth(month: string): Promise<boolean> {
  const client = createSupabaseClient()

  // First, verify the record exists before deletion
  const { data: existingRecord } = await client
    .from("planned_amounts")
    .select("id")
    .eq("month", month)
    .single()

  // If record doesn't exist, return false (nothing to delete)
  if (!existingRecord) {
    return false
  }

  const { error } = await client
    .from("planned_amounts")
    .delete()
    .eq("month", month)

  if (error) {
    throw new Error(`Failed to delete planned amounts: ${error.message}`)
  }

  return true
}
