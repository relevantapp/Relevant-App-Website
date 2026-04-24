import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js'

import { getValidAccessToken, supabase } from '@/lib/supabase'

export type AccountDeletionStatus = {
  status: 'none' | 'pending' | 'cancelled' | 'completed'
  mode: 'temporary' | 'permanent' | null
  requestedAt: string | null
  deleteAfter: string | null
  daysRemaining: number | null
  graceDays: number
}

type AccountDeletionResponse = {
  success: boolean
  status?: AccountDeletionStatus
  error_code?: string
  message?: string
}

const FUNCTION_NAME = 'account-deletion'

async function toReadableFunctionError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { message?: string }
      return new Error(body?.message || 'Request failed.')
    } catch {
      return new Error('Request failed.')
    }
  }
  if (error instanceof FunctionsRelayError) {
    return new Error('Network relay error. Please try again.')
  }
  if (error instanceof FunctionsFetchError) {
    return new Error('Could not reach the server. Check your connection.')
  }
  return new Error('Something went wrong. Please try again.')
}

async function invokeAccountDeletion(body: Record<string, unknown>): Promise<AccountDeletionStatus> {
  const token = await getValidAccessToken(180)
  if (!token) throw new Error('Authentication required.')

  const { data, error } = await supabase.functions.invoke<AccountDeletionResponse>(FUNCTION_NAME, {
    body,
    headers: { Authorization: `Bearer ${token}` },
  })

  if (error) throw await toReadableFunctionError(error)
  if (!data?.status) throw new Error('Unexpected server response.')
  return data.status
}

export async function fetchAccountDeletionStatus(): Promise<AccountDeletionStatus> {
  return invokeAccountDeletion({ action: 'status' })
}

export async function requestAccountDeletion(
  mode: 'temporary' | 'permanent',
  password: string,
): Promise<AccountDeletionStatus> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user?.email) throw new Error('Sign in to continue.')

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: data.user.email,
    password,
  })

  if (reauthError) {
    const msg = reauthError.message.toLowerCase()
    if (msg.includes('invalid') || msg.includes('credentials')) {
      throw new Error('Invalid password.')
    }
    throw new Error('Could not verify your password.')
  }

  return invokeAccountDeletion({ action: 'request', mode })
}

export async function cancelAccountDeletion(): Promise<AccountDeletionStatus> {
  return invokeAccountDeletion({ action: 'cancel' })
}
