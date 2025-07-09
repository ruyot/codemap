"use client"

import { useState, useCallback } from 'react'
import { BlackboxResponse } from '@/types'

interface UseBlackboxOptions {
  onSuccess?: (response: BlackboxResponse) => void
  onError?: (error: Error) => void
}

export function useBlackbox(options: UseBlackboxOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<BlackboxResponse | null>(null)

  const reviewDiff = useCallback(async (diff: string, filePath?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/blackbox/review-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff, filePath })
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setResponse(data)
      options.onSuccess?.(data)
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  const suggestRefactor = useCallback(async (code: string, filePath: string, context?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/blackbox/suggest-refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, filePath, context })
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setResponse(data)
      options.onSuccess?.(data)
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  const generateCode = useCallback(async (prompt: string, language: string = 'typescript') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/blackbox/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language })
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setResponse(data)
      options.onSuccess?.(data)
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  const explainCode = useCallback(async (code: string, filePath?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/blackbox/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, filePath })
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setResponse(data)
      options.onSuccess?.(data)
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  const streamResponse = useCallback(async function* (
    endpoint: string, 
    payload: any
  ): AsyncGenerator<string, void, unknown> {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        yield chunk
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setResponse(null)
  }, [])

  return {
    loading,
    error,
    response,
    reviewDiff,
    suggestRefactor,
    generateCode,
    explainCode,
    streamResponse,
    reset
  }
}
