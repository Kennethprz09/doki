import { useEffect, useCallback, useRef } from "react"
import { AppState, type AppStateStatus } from "react-native"
import Toast from "react-native-toast-message"
import * as Network from "expo-network"
import { useGlobalStore } from "../store/globalStore"
import { syncUser } from "../utils/actions"

interface NetworkInfo {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: Network.NetworkStateType
}

const useNetInfo = () => {
  const { networkStatus, setNetworkStatus, setError } = useGlobalStore()
  const lastNetworkState = useRef<NetworkInfo | null>(null)
  const syncInProgress = useRef(false)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Refs para evitar que el useEffect de setup se re-ejecute cuando cambian las funciones
  const setNetworkStatusRef = useRef(setNetworkStatus)
  const setErrorRef = useRef(setError)
  useEffect(() => { setNetworkStatusRef.current = setNetworkStatus }, [setNetworkStatus])
  useEffect(() => { setErrorRef.current = setError }, [setError])

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

      if (
        !lastNetworkState.current ||
        lastNetworkState.current.isConnected !== currentNetworkInfo.isConnected ||
        lastNetworkState.current.isInternetReachable !== currentNetworkInfo.isInternetReachable
      ) {
        setNetworkStatusRef.current(isNowOnline ? "online" : "offline")

        if (lastNetworkState.current?.isConnected && !currentNetworkInfo.isConnected) {
          Toast.show({ type: "error", text1: "Sin conexión", text2: "No tienes conexión a Internet. Los datos se mostrarán en modo offline." })
        }

        if (wasOffline && isNowOnline && !syncInProgress.current) {
          syncInProgress.current = true
          try {
            const result = await syncUser()
            if (!result.success) {
              setErrorRef.current(`Error de sincronización: ${result.error}`)
            }
          } finally {
            syncInProgress.current = false
          }
        }

        lastNetworkState.current = currentNetworkInfo
      }
    } catch {
      setErrorRef.current("Error al verificar conexión de red")
      setNetworkStatusRef.current("unknown")
    }
  }, [])

  // Ref para usar siempre la versión actualizada dentro del listener
  const checkNetworkStatusRef = useRef(checkNetworkStatus)
  useEffect(() => { checkNetworkStatusRef.current = checkNetworkStatus }, [checkNetworkStatus])

  useEffect(() => {
    checkNetworkStatusRef.current()

    const appStateSubscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkNetworkStatusRef.current()
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = setInterval(() => checkNetworkStatusRef.current(), 30000)
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
          checkIntervalRef.current = null
        }
      }
    })

    checkIntervalRef.current = setInterval(() => checkNetworkStatusRef.current(), 30000)

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
      appStateSubscription.remove()
    }
  }, [])

  return {
    isConnected: networkStatus === "online",
    networkStatus,
    isOnline: networkStatus === "online",
    isOffline: networkStatus === "offline",
  }
}

export default useNetInfo
