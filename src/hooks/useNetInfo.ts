import { useEffect, useCallback, useRef } from "react"
import { Alert, AppState, type AppStateStatus } from "react-native"
import * as Network from "expo-network"
import { useGlobalStore } from "../store/globalStore"
import { syncUser } from "../utils/actions"

interface NetworkInfo {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: Network.NetworkStateType
}

// Optimización 1: Hook más robusto con mejor manejo de estado
const useNetInfo = () => {
  const { networkStatus, setNetworkStatus, setError } = useGlobalStore()
  const lastNetworkState = useRef<NetworkInfo | null>(null)
  const syncInProgress = useRef(false)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Optimización 2: Función de verificación de red con debounce
  const checkNetworkStatus = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync()
      const currentNetworkInfo: NetworkInfo = {
        isConnected: networkState.isConnected ?? false,
        isInternetReachable: networkState.isInternetReachable,
        type: networkState.type,
      }

      const wasOffline = lastNetworkState.current?.isConnected === false
      const isNowOnline = currentNetworkInfo.isConnected && currentNetworkInfo.isInternetReachable !== false

      // Solo actualizar si hay cambios significativos
      if (
        !lastNetworkState.current ||
        lastNetworkState.current.isConnected !== currentNetworkInfo.isConnected ||
        lastNetworkState.current.isInternetReachable !== currentNetworkInfo.isInternetReachable
      ) {
        const newStatus = isNowOnline ? "online" : "offline"
        setNetworkStatus(newStatus)

        // Mostrar alerta solo cuando se pierde la conexión
        if (lastNetworkState.current?.isConnected && !currentNetworkInfo.isConnected) {
          Alert.alert("Sin conexión", "No tienes conexión a Internet. Los datos se mostrarán en modo offline.", [
            { text: "Entendido", style: "default" },
          ])
        }

        // Sincronizar cuando se recupera la conexión
        if (wasOffline && isNowOnline && !syncInProgress.current) {
          syncInProgress.current = true
          try {
            const result = await syncUser()
            if (!result.success) {
              setError(`Error de sincronización: ${result.error}`)
            }
          } catch (error) {
            console.error("Error during sync:", error)
            setError("Error al sincronizar datos")
          } finally {
            syncInProgress.current = false
          }
        }

        lastNetworkState.current = currentNetworkInfo
      }
    } catch (error) {
      console.error("Error checking network status:", error)
      setError("Error al verificar conexión de red")
      setNetworkStatus("unknown")
    }
  }, [setNetworkStatus, setError])

  // Optimización 3: Manejo del estado de la app para pausar verificaciones
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // Verificar inmediatamente cuando la app se activa
        checkNetworkStatus()
        // Reiniciar el intervalo
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
        }
        checkIntervalRef.current = setInterval(checkNetworkStatus, 15000) // Cada 15 segundos
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        // Pausar verificaciones cuando la app está en background
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
          checkIntervalRef.current = null
        }
      }
    },
    [checkNetworkStatus],
  )

  useEffect(() => {
    // Verificación inicial
    checkNetworkStatus()

    // Configurar listener del estado de la app
    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange)

    // Configurar intervalo inicial
    checkIntervalRef.current = setInterval(checkNetworkStatus, 15000)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      appStateSubscription?.remove()
    }
  }, [checkNetworkStatus, handleAppStateChange])

  return {
    isConnected: networkStatus === "online",
    networkStatus,
    isOnline: networkStatus === "online",
    isOffline: networkStatus === "offline",
  }
}

export default useNetInfo
