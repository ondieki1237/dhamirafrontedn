export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

function getToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    // Prefer cookie (set by our login route); fallback to localStorage
    const match = document.cookie.match(/(?:^|; )token=([^;]+)/)
    if (match) return decodeURIComponent(match[1])
    return localStorage.getItem("token")
  } catch {
    return null
  }
}

async function parseError(res: Response) {
  try {
    const data = await res.json()
    return data?.message || res.statusText
  } catch {
    return res.statusText
  }
}

export async function apiGet<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function apiPostJson<T = any>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function apiPutJson<T = any>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function apiPostFormData<T = any>(path: string, form: FormData, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: form,
    ...init,
    headers: {
      ...(init?.headers || {}),
      // DO NOT set Content-Type for FormData; browser will set boundary
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export function getCurrentUser(): { _id: string; username: string; role: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
