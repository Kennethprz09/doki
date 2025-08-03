import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Network from "expo-network"
import { supabase } from "../supabase/supabaseClient"

// Optimización 1: Agregar tipos más específicos
interface NetworkState {
  isConnected: boolean
  isInternetReachable: boolean | null
}

interface SyncResult {
  success: boolean
  error?: string
  data?: any
}

// Optimización 2: Mejorar la función de verificación de conexión
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    // const networkState = await Network.getNetworkStateAsync()
    // // Verificar tanto la conexión como la accesibilidad a internet
    // return networkState.isConnected && (networkState.isInternetReachable ?? true)
    const networkState = await Network.getNetworkStateAsync();
    return !networkState.isConnected;
  } catch (error) {
    console.error("Error checking internet connection:", error)
    return false
  }
}

// Optimización 3: Mejorar la función de sincronización con mejor manejo de errores
export const syncUser = async (): Promise<SyncResult> => {
  try {
    // Verificar conexión antes de sincronizar
    const isConnected = await checkInternetConnection()
    if (!isConnected) {
      return {
        success: false,
        error: "No hay conexión a internet",
      }
    }

    const userData = await AsyncStorage.getItem("user")
    if (!userData) {
      return {
        success: false,
        error: "No hay datos de usuario para sincronizar",
      }
    }

    const parsedUser = JSON.parse(userData)
    const userId = parsedUser.id

    if (!userId) {
      return {
        success: false,
        error: "ID de usuario no válido",
      }
    }

    // Usar upsert para simplificar la lógica
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: parsedUser.email,
          name: parsedUser.name,
          surname: parsedUser.surname,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Error syncing user:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Actualizar AsyncStorage con los datos sincronizados
    await AsyncStorage.setItem("user", JSON.stringify(data))

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error syncing user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// Optimización 4: Función para limpiar datos obsoletos
export const cleanupStorage = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const obsoleteKeys = keys.filter(
      (key) =>
        key.startsWith("temp_") ||
        (key.includes("cache_") && key.includes(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toDateString())),
    )

    if (obsoleteKeys.length > 0) {
      await AsyncStorage.multiRemove(obsoleteKeys)
    }
  } catch (error) {
    console.error("Error cleaning up storage:", error)
  }
}

// Optimización 5: Función para retry con backoff exponencial
export const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries - 1) {
        throw lastError
      }

      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
