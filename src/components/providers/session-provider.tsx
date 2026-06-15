"use client"

import { createContext, useContext, useCallback, useState, useEffect } from "react"
import type { User } from "@/types"
import { getCurrentUserAction } from "@/features/auth/actions"

type SessionContext = {
  user: User | null
  isLoading: boolean
  refresh: () => Promise<void>
}

const SessionContext = createContext<SessionContext>({
  user: null,
  isLoading: true,
  refresh: async () => {},
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await getCurrentUserAction()
      if (result.success && result.data) {
        setUser(result.data as User)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SessionContext.Provider value={{ user, isLoading, refresh }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
