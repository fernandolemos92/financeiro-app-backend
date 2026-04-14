import type { Transaction } from "@/types/transaction"
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/schemas/transaction"
import {
  dbCreate,
  dbDelete,
  dbDeleteSeries,
  dbFindAll,
  dbFindById,
  dbUpdate,
} from "@/repositories/transactions"

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ForbiddenError"
  }
}

export async function listTransactions(
  userId: string,
  month?: string
): Promise<Transaction[]> {
  return dbFindAll(userId, month)
}

export async function getTransaction(
  id: string,
  userId: string
): Promise<Transaction> {
  const transaction = await dbFindById(id, userId)

  if (!transaction) {
    throw new NotFoundError(`Transaction not found: ${id}`)
  }

  return transaction
}

export async function createTransaction(
  input: CreateTransactionInput,
  userId: string
): Promise<Transaction> {
  return dbCreate(input, userId)
}

export async function updateTransaction(
  id: string,
  userId: string,
  input: UpdateTransactionInput
): Promise<Transaction> {
  const transaction = await dbUpdate(id, userId, input)

  if (!transaction) {
    throw new NotFoundError(`Transaction not found: ${id}`)
  }

  return transaction
}

export async function deleteTransaction(id: string, userId: string): Promise<void> {
  const deleted = await dbDelete(id, userId)

  if (!deleted) {
    throw new ForbiddenError(`Transaction not found or access denied: ${id}`)
  }
}

export async function deleteTransactionSeries(groupId: string, userId: string): Promise<number> {
  const deletedCount = await dbDeleteSeries(groupId, userId)

  if (deletedCount === 0) {
    throw new ForbiddenError(`Transaction series not found or access denied: ${groupId}`)
  }

  return deletedCount
}
