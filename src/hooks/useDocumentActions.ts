"use client"

import { useCallback } from "react"
import { Alert } from "react-native"
import Toast from "react-native-toast-message"
import { useGlobalStore } from "../store/globalStore"
import { useDocumentsStore } from "../store/documentsStore"
import { checkInternetConnection } from "../utils/actions"
import { supabase } from "../supabase/supabaseClient"
import useDocumentsSync from "./useDocumentsSync"

export const useDocumentActions = () => {
  const { setLoading } = useGlobalStore()
  const { updateDocument, deleteDocument } = useDocumentsStore()
  const { syncDocuments } = useDocumentsSync()


  // Función auxiliar para obtener el usuario actual
  const getCurrentUser = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) {
      throw new Error("Usuario no autenticado")
    }
    return user
  }, [])

  // Función auxiliar para verificar conectividad
  const checkConnectivity = useCallback(async () => {
    const isOffline = await checkInternetConnection()
    if (isOffline) {
      Toast.show({
        type: "error",
        text1: "Sin conexión",
        text2: "No se puede realizar la operación sin conexión a internet",
      })
      return false
    }
    return true
  }, [])

  const toggleFavorite = useCallback(
    async (id: string, currentStatus: boolean) => {
      try {
        if (!(await checkConnectivity())) return false

        setLoading(true)
        const user = await getCurrentUser()

        const { error } = await supabase
          .from("documents")
          .update({ is_favorite: !currentStatus })
          .eq("id", id)
          .eq("user_id", user.id)

        if (error) throw error

        updateDocument({ id, changes: { is_favorite: !currentStatus } })

        await syncDocuments()

        Toast.show({
          type: "success",
          text1: !currentStatus ? "Agregado a favoritos" : "Removido de favoritos",
        })

        return true
      } catch (error) {
        console.error("Error updating favorite:", error)
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudo actualizar el estado de favorito",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, updateDocument, syncDocuments, checkConnectivity, getCurrentUser],
  )

  const deleteDocumentWithConfirmation = useCallback(
    async (id: string, name: string) => {
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          "Confirmar eliminación",
          `¿Estás seguro de que quieres eliminar "${name}"?`,
          [
            {
              text: "Cancelar",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: async () => {
                try {
                  if (!(await checkConnectivity())) {
                    resolve(false)
                    return
                  }

                  setLoading(true)
                  const user = await getCurrentUser()

                  const { error } = await supabase.from("documents").delete().eq("id", id).eq("user_id", user.id)

                  if (error) throw error

                  deleteDocument(id)

                  Toast.show({
                    type: "success",
                    text1: "Documento eliminado",
                  })

                  resolve(true)
                } catch (error) {
                  console.error("Error deleting document:", error)
                  Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: "No se pudo eliminar el documento",
                  })
                  resolve(false)
                } finally {
                  setLoading(false)
                }
              },
            },
          ],
          { cancelable: true },
        )
      })
    },
    [setLoading, deleteDocument, checkConnectivity, getCurrentUser],
  )

  const updateDocumentColor = useCallback(
    async (id: string, color: string) => {
      try {
        if (!(await checkConnectivity())) return false

        setLoading(true)
        const user = await getCurrentUser()

        const { error } = await supabase.from("documents").update({ color }).eq("id", id).eq("user_id", user.id)

        if (error) throw error

        updateDocument({ id, changes: { color } })
        await syncDocuments()

        Toast.show({
          type: "success",
          text1: "Color actualizado",
        })

        return true
      } catch (error) {
        console.error("Error updating color:", error)
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudo actualizar el color",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, updateDocument, syncDocuments, checkConnectivity, getCurrentUser],
  )

  const moveDocuments = useCallback(
    async (documentIds: string[], targetFolderId: string | null) => {
      try {
        if (!(await checkConnectivity())) return false

        setLoading(true)
        const user = await getCurrentUser()

        const { error } = await supabase
          .from("documents")
          .update({ folder_id: targetFolderId })
          .in("id", documentIds)
          .eq("user_id", user.id)

        if (error) throw error

        // Actualizar documentos en el store
        documentIds.forEach((id) => {
          updateDocument({ id, changes: { folder_id: targetFolderId } })
        })

        Toast.show({
          type: "success",
          text1: "Documentos movidos",
          text2: `${documentIds.length} documento(s) movido(s) correctamente`,
        })

        return true
      } catch (error) {
        console.error("Error moving documents:", error)
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudieron mover los documentos",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, updateDocument, checkConnectivity, getCurrentUser],
  )

  return {
    toggleFavorite,
    deleteDocumentWithConfirmation,
    updateDocumentColor,
    moveDocuments,
  }
}
