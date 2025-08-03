import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

// Optimización 1: Estado global más completo
interface GlobalState {
  loading: boolean
  networkStatus: "online" | "offline" | "unknown"
  appState: "active" | "background" | "inactive"
  error: string | null

  // Actions
  setLoading: (loading: boolean) => void
  setNetworkStatus: (status: "online" | "offline" | "unknown") => void
  setAppState: (state: "active" | "background" | "inactive") => void
  setError: (error: string | null) => void
  clearError: () => void
}

// Optimización 2: Usar subscribeWithSelector para mejor rendimiento
export const useGlobalStore = create<GlobalState>()(
  subscribeWithSelector((set) => ({
    loading: false,
    networkStatus: "unknown",
    appState: "active",
    error: null,

    setLoading: (loading) => set({ loading }),

    setNetworkStatus: (networkStatus) => set({ networkStatus }),

    setAppState: (appState) => set({ appState }),

    setError: (error) => set({ error }),

    clearError: () => set({ error: null }),
  })),
)

// Optimización 3: Selectores optimizados para evitar re-renders innecesarios
export const useLoading = () => useGlobalStore((state) => state.loading)
export const useNetworkStatus = () => useGlobalStore((state) => state.networkStatus)
export const useAppState = () => useGlobalStore((state) => state.appState)
export const useGlobalError = () => useGlobalStore((state) => state.error)
