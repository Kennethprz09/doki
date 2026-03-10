import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

interface GlobalState {
  loading: boolean
  networkStatus: "online" | "offline" | "unknown"
  error: string | null

  // Actions
  setLoading: (loading: boolean) => void
  setNetworkStatus: (status: "online" | "offline" | "unknown") => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useGlobalStore = create<GlobalState>()(
  subscribeWithSelector((set) => ({
    loading: false,
    networkStatus: "unknown",
    error: null,

    setLoading: (loading) => set({ loading }),

    setNetworkStatus: (networkStatus) => set({ networkStatus }),

    setError: (error) => set({ error }),

    clearError: () => set({ error: null }),
  })),
)
