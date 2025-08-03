"use client"

import { useCallback, useEffect, useRef } from "react"
import { useSupabaseSubscription } from "../contexts/SupabaseSubscriptionContext"
import { useDocumentsStore } from "../store/documentsStore"
import { useUserStore } from "../store/userStore"
import { useGlobalStore } from "../store/globalStore"
import { supabase } from "../supabase/supabaseClient"

interface SyncOptions {
  forceSync?: boolean
  onSuccess?: () => void
  onError?: (error: string) => void
}

// Optimización 1: Hook más completo para sincronización de documentos
const useDocumentsSync = () => {
  const { isSubscribed, reconnect } = useSupabaseSubscription()
  const { documents, setDocuments, setDocumentsFavorite, setLoading, setError } = useDocumentsStore()
  const user = useUserStore((state) => state.user)
  const { networkStatus } = useGlobalStore()

  const lastSyncRef = useRef<Date | null>(null)
  const syncInProgressRef = useRef(false)

  // Optimización 2: Función para sincronización manual
  const syncDocuments = useCallback(
    async (options: SyncOptions = {}) => {
      if (!user?.id || syncInProgressRef.current) {
        options.onError?.("No se puede sincronizar: usuario no válido o sincronización en progreso")
        return false
      }

      if (networkStatus !== "online" && !options.forceSync) {
        options.onError?.("No hay conexión a internet")
        return false
      }

      syncInProgressRef.current = true
      setLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        const allDocuments = Array.isArray(data) ? data : []
        const rootDocuments = allDocuments.filter((doc) => !doc.folder_id)
        const favoriteDocuments = allDocuments.filter((doc) => doc.is_favorite)

        setDocuments(rootDocuments)
        setDocumentsFavorite(favoriteDocuments)

        lastSyncRef.current = new Date()
        options.onSuccess?.()

        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error al sincronizar documentos"
        console.error("Error syncing documents:", error)
        setError(errorMessage)
        options.onError?.(errorMessage)
        return false
      } finally {
        setLoading(false)
        syncInProgressRef.current = false
      }
    },
    [user?.id, networkStatus, setDocuments, setDocumentsFavorite, setLoading, setError],
  )

  // Optimización 3: Función para verificar si necesita sincronización
  const needsSync = useCallback(() => {
    if (!lastSyncRef.current) return true

    const timeSinceLastSync = Date.now() - lastSyncRef.current.getTime()
    const fiveMinutes = 5 * 60 * 1000

    return timeSinceLastSync > fiveMinutes
  }, [])

  // Optimización 4: Sincronización automática cuando se recupera la conexión
  useEffect(() => {
    if (networkStatus === "online" && needsSync() && !isSubscribed && user?.id) {
      syncDocuments({
        onError: (error) => console.warn("Auto-sync failed:", error),
      })
    }
  }, [networkStatus, needsSync, isSubscribed, syncDocuments])

  // Optimización 5: Reconexión automática si la suscripción falla
  useEffect(() => {
    if (networkStatus === "online" && !isSubscribed && user?.id) {
      const reconnectTimer = setTimeout(() => {
        reconnect()
      }, 3000) // Esperar 3 segundos antes de reconectar

      return () => clearTimeout(reconnectTimer)
    }
  }, [networkStatus, isSubscribed, user?.id, reconnect])

  return {
    isSubscribed,
    isSyncing: syncInProgressRef.current,
    lastSync: lastSyncRef.current,
    syncDocuments,
    needsSync: needsSync(),
    documentsCount: documents.length,
    reconnectSubscription: reconnect,
  }
}

export default useDocumentsSync
