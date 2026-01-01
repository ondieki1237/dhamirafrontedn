"use client"

import { useEffect, useState } from "react"

/**
 * Custom hook for responsive design
 * Returns true if the media query matches
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [query])

  // Return false on server-side to avoid hydration mismatch
  return mounted ? matches : false
}

/**
 * Predefined breakpoint hooks for common screen sizes
 */
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)")
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)")
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)")
}

export function useIsSmallMobile() {
  return useMediaQuery("(max-width: 430px)")
}
