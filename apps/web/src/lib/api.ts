const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      throw new ApiError(res.status, body.error || res.statusText)
    }

    return res.json() as Promise<T>
  }

  get<T>(path: string) {
    return this.fetch<T>(path)
  }

  post<T>(path: string, data?: unknown) {
    return this.fetch<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  patch<T>(path: string, data: unknown) {
    return this.fetch<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  put<T>(path: string, data: unknown) {
    return this.fetch<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  delete<T>(path: string) {
    return this.fetch<T>(path, { method: 'DELETE' })
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export const api = new ApiClient(API_URL)
