import type { Transaction } from "@/types/transaction"
import { createSupabaseClient } from "@/db/client"
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/schemas/transaction"

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as "income" | "expense",
    amount: Number(row.amount),
    category: row.category as string,
    subcategory: row.subcategory as string | undefined,
    description: row.description as string | undefined,
    date: row.date as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    income_type: row.income_type as
      | "fixed"
      | "variable"
      | "oscillating"
      | undefined,
    expense_nature: row.expense_nature as
      | "debt"
      | "cost_of_living"
      | "pleasure"
      | "application"
      | undefined,
    frequency: row.frequency as "monthly" | "annual" | "occasional" | undefined,
    planning_status: row.planning_status as "planned" | "realized" | undefined,
    installment_total: row.installment_total as number | undefined,
    installment_number: row.installment_number as number | undefined,
    purchase_total_amount: row.purchase_total_amount as number | undefined,
    installment_group_id: row.installment_group_id as string | undefined,
    user_id: row.user_id as string,
  }
}

export async function dbFindAll(
  userId: string,
  month?: string
): Promise<Transaction[]> {
  const client = createSupabaseClient()
  let query = client
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", {
      ascending: false,
    })

  if (month) {
    const pattern = `${month}%`
    query = query.ilike("date", pattern)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  return (data || []).map(rowToTransaction)
}

export async function dbFindById(
  id: string,
  userId: string
): Promise<Transaction | null> {
  const client = createSupabaseClient()
  const { data, error } = await client
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to fetch transaction: ${error.message}`)
  }

  return data ? rowToTransaction(data) : null
}

export async function dbCreate(
  input: CreateTransactionInput,
  userId: string
): Promise<Transaction> {
  const client = createSupabaseClient()

  // If installment_total > 1, use atomic RPC function
  if (input.installment_total && input.installment_total > 1) {
    const { data, error } = await client.rpc('create_installment_series', {
      p_user_id: userId,
      p_type: input.type,
      p_purchase_total_amount: input.purchase_total_amount,
      p_installment_total: input.installment_total,
      p_category: input.category,
      p_subcategory: input.subcategory || null,
      p_description: input.description || null,
      p_date: input.date,
      p_income_type: input.income_type || null,
      p_expense_nature: input.expense_nature || null,
      p_frequency: input.frequency || null,
      p_planning_status: input.planning_status || "realized",
    })

    if (error) {
      console.error("RPC error:", error)
      throw new Error(`Failed to create installment series: ${error.message}`)
    }

    // Fetch and return the first transaction using group_id
    if (data && data.group_id) {
      // Small delay to ensure commit is fully processed
      await new Promise(resolve => setTimeout(resolve, 100))

      const { data: firstTx, error: fetchError } = await client
        .from('transactions')
        .select('*')
        .eq('installment_group_id', data.group_id)
        .eq('installment_number', 1)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error("Fetch error:", fetchError)
        throw new Error(`Failed to fetch created transaction: ${fetchError.message}`)
      }

      return rowToTransaction(firstTx)
    }

    throw new Error('RPC did not return group_id')
  }

  // Regular transaction (non-installment or installment_total = 1)
  const insertData = {
    type: input.type,
    amount: input.amount,
    category: input.category,
    subcategory: input.subcategory || null,
    description: input.description || null,
    date: input.date,
    income_type: input.income_type || null,
    expense_nature: input.expense_nature || null,
    frequency: input.frequency || null,
    planning_status: input.planning_status || "realized",
    installment_total: input.installment_total || null,
    installment_number: input.installment_number || null,
    purchase_total_amount: input.purchase_total_amount || null,
    installment_group_id: null,
    user_id: userId,
  }

  const { data, error } = await client
    .from("transactions")
    .insert([insertData])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`)
  }

  return rowToTransaction(data)
}

export async function dbUpdate(
  id: string,
  userId: string,
  input: UpdateTransactionInput
): Promise<Transaction | null> {
  const client = createSupabaseClient()

  const updateData: Record<string, unknown> = {}

  if (input.type !== undefined) updateData.type = input.type
  if (input.amount !== undefined) updateData.amount = input.amount
  if (input.category !== undefined) updateData.category = input.category
  if (input.subcategory !== undefined)
    updateData.subcategory = input.subcategory || null
  if (input.description !== undefined)
    updateData.description = input.description || null
  if (input.date !== undefined) updateData.date = input.date
  if (input.income_type !== undefined)
    updateData.income_type = input.income_type || null
  if (input.expense_nature !== undefined)
    updateData.expense_nature = input.expense_nature || null
  if (input.frequency !== undefined)
    updateData.frequency = input.frequency || null
  if (input.planning_status !== undefined)
    updateData.planning_status = input.planning_status || "realized"
  if (input.installment_total !== undefined)
    updateData.installment_total = input.installment_total || null
  if (input.installment_number !== undefined)
    updateData.installment_number = input.installment_number || null
  if (input.purchase_total_amount !== undefined)
    updateData.purchase_total_amount = input.purchase_total_amount || null
  // Note: installment_group_id is immutable, cannot be updated

  const { data, error } = await client
    .from("transactions")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to update transaction: ${error.message}`)
  }

  return data ? rowToTransaction(data) : null
}

export async function dbDelete(id: string, userId: string): Promise<boolean> {
  const client = createSupabaseClient()

  // First, verify the record exists and belongs to the user before deletion
  const { data: existingRecord } = await client
    .from("transactions")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  // If record doesn't exist or doesn't belong to user, return false
  if (!existingRecord) {
    return false
  }

  const { error } = await client
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`)
  }

  return true
}
