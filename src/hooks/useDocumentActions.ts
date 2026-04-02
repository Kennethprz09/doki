import { useCallback } from "react"
import { DeviceEventEmitter } from "react-native"
import Toast from "react-native-toast-message"
import { useGlobalStore } from "../store/globalStore"
import { useDocumentsStore } from "../store/documentsStore"
import { useUserStore } from "../store/userStore"
import { checkInternetConnection } from "../utils/actions"
import { supabase } from "../supabase/supabaseClient"

export const useDocumentActions = () => {
  const { setLoading } = useGlobalStore()
  const { updateDocument, deleteDocument } = useDocumentsStore()
  const user = useUserStore((state) => state.user)

  // Función auxiliar para obtener el usuario actual (del store, sin request de red)
  const getUserId = useCallback(() => {
    if (!user?.id) {
      throw new Error("Usuario no autenticado")
    }
    return user.id
  }, [user?.id])

  // Función auxiliar para verificar conectividad
  const checkConnectivity = useCallback(async () => {
    const isConnected = await checkInternetConnection()
    if (!isConnected) {
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
        const userId = getUserId()

        const { error } = await supabase
          .from("documents")
          .update({ is_favorite: !currentStatus })
          .eq("id", id)
          .eq("user_id", userId)

        if (error) throw error

        updateDocument({ id, changes: { is_favorite: !currentStatus } })

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
    [setLoading, updateDocument, checkConnectivity, getUserId],
  )

  const deleteDocumentById = useCallback(
    async (id: string) => {
      try {
        if (!(await checkConnectivity())) return false

        setLoading(true)
        const userId = getUserId()

        // Obtener el path del archivo antes de eliminar el registro
        const { data: doc, error: fetchError } = await supabase
          .from("documents")
          .select("path, is_folder")
          .eq("id", id)
          .eq("user_id", userId)
          .single()

        if (fetchError || !doc) throw fetchError || new Error("Documento no encontrado")

        // Eliminar del bucket si tiene path (es un archivo, no una carpeta)
        if (!doc.is_folder && doc.path) {
          const { error: storageError } = await supabase.storage
            .from("documents")
            .remove([doc.path])

          if (storageError) {
            console.error("Error deleting from storage:", storageError)
          }
        }

        // Eliminar el registro de la base de datos
        const { error } = await supabase.from("documents").delete().eq("id", id).eq("user_id", userId)

        if (error) throw error

        deleteDocument(id)

        Toast.show({
          type: "success",
          text1: "Documento eliminado",
        })

        return true
      } catch (error) {
        console.error("Error deleting document:", error)
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudo eliminar el documento",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, deleteDocument, checkConnectivity, getUserId],
  )

  const updateDocumentColor = useCallback(
    async (id: string, color: string) => {
      try {
        if (!(await checkConnectivity())) return false

        setLoading(true)
        const userId = getUserId()

        const { error } = await supabase.from("documents").update({ color }).eq("id", id).eq("user_id", userId)

        if (error) throw error

        updateDocument({ id, changes: { color } })

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
    [setLoading, updateDocument, checkConnectivity, getUserId],
  )

  const moveDocuments = useCallback(
    async (documentIds: string[], targetFolderId: string | null) => {
      try {
        if (!(await checkConnectivity())) return false

        setLoading(true)
        const userId = getUserId()

        const { error } = await supabase
          .from("documents")
          .update({ folder_id: targetFolderId })
          .in("id", documentIds)
          .eq("user_id", userId)

        if (error) throw error

        // Actualizar documentos en el store
        documentIds.forEach((id) => {
          updateDocument({ id, changes: { folder_id: targetFolderId } })
        })

        DeviceEventEmitter.emit("document:moved", { documentIds, targetFolderId })

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
    [setLoading, updateDocument, checkConnectivity, getUserId],
  )

  return {
    toggleFavorite,
    deleteDocumentById,
    updateDocumentColor,
    moveDocuments,
  }
}
