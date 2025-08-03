"use client"

import { useCallback, useEffect, useState } from "react"
import { useDocumentsStore } from "../store/documentsStore"
import { checkInternetConnection } from "../utils/actions"
import { supabase } from "../supabase/supabaseClient"
import type { Document } from "../components/types"
import Toast from "react-native-toast-message"

// Optimización 1: Hook para manejar documentos de carpeta
export const useFolderDocuments = (folder: Document | null) => {
  const { documentsFolder, setDocumentsFolder } = useDocumentsStore()
  const [loading, setLoading] = useState(false)

  // Optimización 2: Función para obtener documentos de la carpeta
  const fetchFolderDocuments = useCallback(async () => {
    if (!folder?.id) {
      setDocumentsFolder([]) // Limpiar si no hay carpeta
      return
    }

    try {
      const isOffline = await checkInternetConnection()
      if (isOffline) {
        Toast.show({
          type: "error",
          text1: "Sin conexión",
          text2: "No se pueden cargar los documentos sin conexión",
        })
        return
      }

      setLoading(true)

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("folder_id", folder.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setDocumentsFolder(data || [])
    } catch (error) {
      console.error("Error fetching folder documents:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar los documentos de la carpeta",
      })
    } finally {
      setLoading(false)
    }
  }, [folder?.id, setDocumentsFolder])

  // Optimización 3: Obtener documentos filtrados por carpeta (ahora solo se usa el estado directo)
  const folderDocuments = documentsFolder // documentsFolder ya contiene solo los documentos de la carpeta actual

  // Optimización 4: Cargar documentos al cambiar la carpeta
  useEffect(() => {
    if (folder?.id) {
      fetchFolderDocuments()
    } else {
      setDocumentsFolder([]) // Limpiar documentos de carpeta si no hay carpeta seleccionada
    }
  }, [folder?.id, fetchFolderDocuments, setDocumentsFolder])

  return {
    folderDocuments,
    loading,
    refetch: fetchFolderDocuments,
  }
}
