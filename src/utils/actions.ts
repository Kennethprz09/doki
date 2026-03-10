import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Network from "expo-network"
import { supabase } from "../supabase/supabaseClient"

interface SyncResult {
  success: boolean
  error?: string
  data?: any
}

export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const networkState = await Network.getNetworkStateAsync()
    return networkState.isConnected === true && (networkState.isInternetReachable ?? true)
  } catch {
    return false
  }
}

export const syncUser = async (): Promise<SyncResult> => {
  try {
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
