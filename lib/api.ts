// Determine API URL based on environment
// Use LOCAL_API_URL for development, NEXT_PUBLIC_API_URL for production
export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? (process.env.LOCAL_API_URL || "http://localhost:5011")
    : (process.env.NEXT_PUBLIC_API_URL || "https://dhamira.codewithseth.co.ke")

// Logout utility function
function handleLogout() {
  if (typeof window === "undefined") return
  
  // Clear token from localStorage
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  
  // Clear token from cookies
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  
  // Redirect to login page
  window.location.href = "/login"
}

// Check if token is expired by decoding JWT
function isTokenExpired(token: string): boolean {
  try {
    // Check if token has the JWT format (3 parts separated by dots)
    const parts = token.split(".")
    if (parts.length !== 3) {
      // Not a JWT format, but don't assume it's expired - let the server validate
      return false
    }
    
    const payload = JSON.parse(atob(parts[1]))
    
    // Only check expiration if the exp field exists
    if (payload.exp) {
      const expirationTime = payload.exp * 1000 // Convert to milliseconds
      return Date.now() >= expirationTime
    }
    
    // If no expiration field, don't assume it's expired
    return false
  } catch (error) {
    // If we can't decode the token, don't assume it's expired - let the server validate
    console.warn("Dhamira API: Could not decode token, but allowing request to proceed")
    return false
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    const match = document.cookie.match(/(?:^|; )token=([^;]+)/)
    let token = match ? decodeURIComponent(match[1]) : localStorage.getItem("token")

    if (token) {
      token = token.trim()
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.substring(1, token.length - 1)
      }
      
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.warn("Dhamira API: Token has expired. Logging out...")
        handleLogout()
        return null
      }
    }

    if (!token) {
      console.warn("Dhamira API: No Auth Token found. Request may fail on protected routes.")
    }

    return token
  } catch (err) {
    console.error("Dhamira API: Error retrieving token", err)
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
  
  // Handle 401 Unauthorized - token expired or invalid
  if (res.status === 401) {
    console.warn("Dhamira API: Unauthorized (401). Token may be expired. Logging out...")
    handleLogout()
    throw new Error("Your session has expired. Please log in again.")
  }
  
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
  
  // Handle 401 Unauthorized - token expired or invalid
  if (res.status === 401) {
    console.warn("Dhamira API: Unauthorized (401). Token may be expired. Logging out...")
    handleLogout()
    throw new Error("Your session has expired. Please log in again.")
  }
  
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
  
  // Handle 401 Unauthorized - token expired or invalid
  if (res.status === 401) {
    console.warn("Dhamira API: Unauthorized (401). Token may be expired. Logging out...")
    handleLogout()
    throw new Error("Your session has expired. Please log in again.")
  }
  
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
  
  // Handle 401 Unauthorized - token expired or invalid
  if (res.status === 401) {
    console.warn("Dhamira API: Unauthorized (401). Token may be expired. Logging out...")
    handleLogout()
    throw new Error("Your session has expired. Please log in again.")
  }
  
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function apiDelete<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  
  // Handle 401 Unauthorized - token expired or invalid
  if (res.status === 401) {
    console.warn("Dhamira API: Unauthorized (401). Token may be expired. Logging out...")
    handleLogout()
    throw new Error("Your session has expired. Please log in again.")
  }
  
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
