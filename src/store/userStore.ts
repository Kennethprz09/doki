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

// Optimización 4: Función para inicializar usuario con mejor manejo de errores
const initializeUser = async (): Promise<User | null> => {
  try {
    const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY)
    if (!storedUser) return null

    const parsedUser = JSON.parse(storedUser)
    return validateUser(parsedUser) ? parsedUser : null
  } catch (error) {
    console.error("Error al cargar usuario desde AsyncStorage:", error)
    // Limpiar datos corruptos
    await AsyncStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
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

      loadUser: async () => {
        const { setLoading, setError, setUser } = get()

        try {
          setLoading(true)
          setError(null)

          const storedUser = await initializeUser()
          setUser(storedUser)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error al cargar usuario"
          setError(errorMessage)
          console.error("Error loading user:", error)
        } finally {
          setLoading(false)
        }
      },

      clearUser: async () => {
        const { setLoading, setError } = get()

        try {
          setLoading(true)
          set({ user: null, error: null })
          await AsyncStorage.removeItem(USER_STORAGE_KEY)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error al limpiar usuario"
          setError(errorMessage)
          console.error("Error clearing user:", error)
        } finally {
          setLoading(false)
        }
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
