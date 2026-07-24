/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { ERROR_MESSAGES } from '../../constants'

type RequestErrorLike = {
  message?: string
  response?: {
    data?: {
      error?: {
        code?: string
        message?: string
        param?: string
        type?: string
      }
      message?: string
    }
  }
}

export type RequestErrorDetails = {
  errorCode?: string
  errorMessage: string
}

function formatOpenAIErrorMessage(
  error:
    | {
        code?: string
        message?: string
        param?: string
      }
    | undefined
): string | undefined {
  if (!error?.message || typeof error.message !== 'string') return undefined
  const message = error.message.trim()
  if (!message) return undefined
  if (error.param && typeof error.param === 'string' && error.param.trim()) {
    return `${message} (${error.param})`
  }
  return message
}

export function parseRequestErrorDetails(error: unknown): RequestErrorDetails {
  const requestError = error as RequestErrorLike
  const data = requestError?.response?.data
  const openAIMessage = formatOpenAIErrorMessage(data?.error)

  return {
    errorCode: data?.error?.code || undefined,
    errorMessage:
      openAIMessage ||
      (typeof data?.message === 'string' ? data.message : undefined) ||
      requestError?.message ||
      ERROR_MESSAGES.API_REQUEST_ERROR,
  }
}
