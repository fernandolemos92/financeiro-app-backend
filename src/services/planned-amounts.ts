import type { PlannedAmounts } from "@/types/planned-amounts"
import type { UpsertPlannedAmountsInput } from "@/schemas/planned-amounts"
import { dbFindByMonth, dbUpsert } from "@/repositories/planned-amounts"

export async function getPlannedAmountsByMonth(
  month: string
): Promise<PlannedAmounts> {
  const result = await dbFindByMonth(month)

  // Return zeros if month doesn't exist (no 404)
  if (!result) {
    return {
      month,
      debt: 0,
      cost_of_living: 0,
      pleasure: 0,
      application: 0,
    }
  }

  return result
}

export async function upsertPlannedAmounts(
  month: string,
  input: UpsertPlannedAmountsInput
): Promise<PlannedAmounts> {
  return dbUpsert(month, input)
}
