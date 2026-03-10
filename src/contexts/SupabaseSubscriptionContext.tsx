import React from "react"
import { createContext, useContext, useEffect, useRef, useCallback } from "react"
import { AppState, type AppStateStatus } from "react-native"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "../supabase/supabaseClient"
import { useUserStore } from "../store/userStore"
import { useDocumentsStore } from "../store/documentsStore"
import { useGlobalStore } from "../store/globalStore"
import type { Document } from "../components/types"

interface SubscriptionContextType {
  isSubscribed: boolean
  reconnect: () => Promise<void>
  disconnect: () => void
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
  reconnect: async () => {},
  disconnect: () => {},
})

export const SupabaseSubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useUserStore((state) => state.user)
  const { setDocuments, setDocumentsFavorite, setLoading, setError } = useDocumentsStore()
  const { networkStatus } = useGlobalStore()

  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fetchInProgressRef = useRef(false)

  // Optimización 1: Función para obtener documentos con mejor manejo de errores
  const fetchDocuments = useCallback(async () => {
    if (!user?.id || fetchInProgressRef.current) return

    fetchInProgressRef.current = true
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .is("folder_id", null)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const documents = Array.isArray(data) ? data : []
      setDocuments(documents)
      setDocumentsFavorite(documents.filter((doc: Document) => doc.is_favorite))
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError(error instanceof Error ? error.message : "Error al cargar documentos")
      // No limpiar documentos en caso de error para mantener datos offline
    } finally {
      setLoading(false)
      fetchInProgressRef.current = false
    }
  }, [user?.id, setDocuments, setDocumentsFavorite, setLoading, setError])

  // Optimización 2: Función para manejar cambios en tiempo real
  const handleRealtimeChange = useCallback(
    (payload: any) => {
      const document = payload.new as Document
      const oldDocument = payload.old as Document

      try {
        switch (payload.eventType) {
          case "INSERT":
            useDocumentsStore.setState((state) => {
              // Evitar duplicados
              const exists = state.documents.some((doc) => doc.id === document.id)
              const existsInFolder = state.documentsFolder.some((doc) => doc.id === document.id)

              // Solo agregar a root si NO tiene folder_id
              const newDocuments = !document.folder_id && !exists
                ? [document, ...state.documents]
                : state.documents

              // Si tiene folder_id, agregar a documentsFolder
              const newDocumentsFolder = document.folder_id && !existsInFolder
                ? [document, ...state.documentsFolder]
                : state.documentsFolder

              const newFavorites = document.is_favorite && !exists
                ? [document, ...state.documentsFavorite]
                : state.documentsFavorite

              return {
                documents: newDocuments,
                documentsFolder: newDocumentsFolder,
                documentsFavorite: newFavorites,
              }
            })
            break

          case "UPDATE":
            useDocumentsStore.setState((state) => {
              const updatedDocuments = state.documents.map((doc) =>
                doc.id === document.id ? { ...doc, ...document } : doc,
              )
              const updatedFolder = state.documentsFolder.map((doc) =>
                doc.id === document.id ? { ...doc, ...document } : doc,
              )
              const allDocs = [...updatedDocuments, ...updatedFolder]
              const updatedFavorites = allDocs.filter((doc) => doc.is_favorite)
              return {
                documents: updatedDocuments,
                documentsFolder: updatedFolder,
                documentsFavorite: updatedFavorites,
              }
            })
            break

          case "DELETE":
            useDocumentsStore.setState((state) => ({
              documents: state.documents.filter((doc) => doc.id !== oldDocument.id),
              documentsFolder: state.documentsFolder.filter((doc) => doc.id !== oldDocument.id),
              documentsFavorite: state.documentsFavorite.filter((doc) => doc.id !== oldDocument.id),
            }))
            break
        }
      } catch (error) {
        console.error("Error handling realtime change:", error)
        setError("Error al procesar cambios en tiempo real")
      }
    },
    [setError],
  )

  // Optimización 3: Función para conectar suscripción
  const connect = useCallback(async () => {
    if (!user?.id || isSubscribedRef.current || networkStatus !== "online") return

    try {
      // Obtener documentos iniciales
      await fetchDocuments()

      // Crear canal de suscripción
      const channel = supabase
        .channel(`documents-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "documents",
            filter: `user_id=eq.${user.id}`,
          },
          handleRealtimeChange,
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            isSubscribedRef.current = true
          } else if (status === "CHANNEL_ERROR") {
            isSubscribedRef.current = false
            // Limpiar timeout previo antes de agendar uno nuevo
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = setTimeout(connect, 5000)
          }
        })

      channelRef.current = channel
    } catch (error) {
      console.error("Error connecting to realtime:", error)
      setError("Error al conectar con el servidor")
    }
  }, [user?.id, networkStatus, fetchDocuments, handleRealtimeChange, setError])

  // Optimización 4: Función para desconectar
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    isSubscribedRef.current = false
  }, [])

  // Optimización 5: Función para reconectar
  const reconnect = useCallback(async () => {
    disconnect()
    await connect()
  }, [disconnect, connect])

  // Refs para que el listener de AppState siempre use la versión actualizada sin re-registrarse
  const reconnectRef = useRef(reconnect)
  const disconnectRef = useRef(disconnect)
  const networkStatusRef = useRef(networkStatus)
  useEffect(() => { reconnectRef.current = reconnect }, [reconnect])
  useEffect(() => { disconnectRef.current = disconnect }, [disconnect])
  useEffect(() => { networkStatusRef.current = networkStatus }, [networkStatus])

  // Efecto principal para manejar conexiones
  useEffect(() => {
    if (user?.id && networkStatus === "online") {
      connect()
    } else {
      disconnect()
    }

    return disconnect
  }, [user?.id, networkStatus, connect, disconnect])

  // Efecto para manejar cambios de estado de la app — se registra solo una vez
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && networkStatusRef.current === "online") {
        reconnectRef.current()
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        disconnectRef.current()
      }
    })
    return () => appStateSubscription.remove()
  }, [])

  const contextValue: SubscriptionContextType = {
    isSubscribed: isSubscribedRef.current,
    reconnect,
    disconnect,
  }

  return <SubscriptionContext.Provider value={contextValue}>{children}</SubscriptionContext.Provider>
}

export const useSupabaseSubscription = () => useContext(SubscriptionContext)
