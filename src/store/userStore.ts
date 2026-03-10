import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Optimización 1: Tipos más específicos y completos
interface UserMetadata {
  name?: string
  surname?: string
  display_name?: string
  email?: string
  email_verified?: boolean
  phone_verified?: boolean
  sub?: string
  avatar_url?: string
  [key: string]: any
}

interface User {
  id: string
  email?: string
  user_metadata?: UserMetadata
  created_at?: string
  updated_at?: string
  last_sign_in_at?: string
  [key: string]: any
}

interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  loadUser: () => Promise<void>
  clearUser: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
}

// Optimización 2: Clave constante para evitar errores de tipeo
const USER_STORAGE_KEY = "@user_data"

// Optimización 3: Función helper para validar datos de usuario
const validateUser = (user: any): user is User => {
  return user && typeof user === "object" && typeof user.id === "string"
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user) => {
        set({ user, error: null })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error })
      },

      // Zustand persist maneja la hidratación automáticamente,
      // loadUser solo fuerza una re-lectura si es necesario
      loadUser: async () => {
        // El middleware persist ya hidrata el estado al iniciar.
        // Este método existe por compatibilidad; no hace nada adicional.
        set({ isLoading: false, error: null })
      },

      // Solo setear null; Zustand persist se encarga de persistir el cambio.
      // NO hacer removeItem manual para evitar race condition con persist.
      clearUser: async () => {
        set({ user: null, error: null, isLoading: false })
      },

      // Optimización 5: Nueva función para actualizar usuario
      updateUser: async (updates) => {
        const { user, setUser, setError } = get()

        if (!user) {
          setError("No hay usuario para actualizar")
          return
        }

        try {
          const updatedUser = { ...user, ...updates }
          setUser(updatedUser)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error al actualizar usuario"
          setError(errorMessage)
          console.error("Error updating user:", error)
        }
      },
    }),
    {
      name: USER_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // Optimización 6: Serialización personalizada para mejor rendimiento
      serialize: (state) => JSON.stringify({ user: state.user }),
      deserialize: (str) => {
        try {
          const parsed = JSON.parse(str)
          return {
            user: validateUser(parsed.user) ? parsed.user : null,
            isLoading: false,
            error: null,
          }
        } catch {
          return {
            user: null,
            isLoading: false,
            error: null,
          }
        }
      },
    },
  ),
)
