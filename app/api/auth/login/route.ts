import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL
    if (!rawBaseUrl) {
      return NextResponse.json({ message: "API base URL not configured" }, { status: 500 })
    }
    const baseUrl = rawBaseUrl.replace(/\/$/, "")

    // Call backend API
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Login failed" }, { status: response.status })
    }

    // Set HttpOnly cookie with token for SSR/middleware and secure auth
    const res = NextResponse.json(data)
    if (data?.token) {
      res.cookies.set({
        name: "token",
        value: data.token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }
    return res
  } catch (error) {
    console.error("/api/auth/login error", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
