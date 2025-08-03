"use client"

import { useCallback, useState } from "react"
import { Alert } from "react-native"
import Toast from "react-native-toast-message"
import { useUserStore } from "../store/userStore"
import { useDocumentsStore } from "../store/documentsStore"
import { useGlobalStore } from "../store/globalStore"
import { checkInternetConnection } from "../utils/actions"
import { supabase } from "../supabase/supabaseClient"
import type { Document } from "../components/types"

interface UseFolderManagerProps {
  onSuccess?: (document: Document) => void
  onError?: (error: string) => void
}

// Optimización 1: Hook para manejo de carpetas
export const useFolderManager = ({ onSuccess, onError }: UseFolderManagerProps = {}) => {
  const user = useUserStore((state) => state.user)
  const { addDocument, updateDocument } = useDocumentsStore()
  const { setLoading } = useGlobalStore()
  const [processing, setProcessing] = useState(false)

  // Optimización 2: Crear nueva carpeta
  const createFolder = useCallback(
    async (name: string) => {
      if (!name.trim()) {
        const errorMsg = "El nombre de la carpeta es obligatorio"
        onError?.(errorMsg)
        Alert.alert("Error", errorMsg)
        return false
      }

      try {
        // Verificar conectividad
        const isOffline = await checkInternetConnection()
        if (isOffline) {
          const errorMsg = "No hay conexión a internet"
          onError?.(errorMsg)
          Toast.show({
            type: "error",
            text1: "Sin conexión",
            text2: "Por favor, verifica tu conexión a internet.",
          })
          return false
        }

        if (!user?.id) {
          const errorMsg = "Usuario no autenticado"
          onError?.(errorMsg)
          Alert.alert("Error", errorMsg)
          return false
        }

        setProcessing(true)
        setLoading(true)

        const { data, error } = await supabase
          .from("documents")
          .insert([
            {
              name: name.trim(),
              user_id: user.id,
              is_folder: true,
              icon: "folder-outline",
            },
          ])
          .select()
          .single()

        if (error) throw error

        // Crear documento para el store
        const newFolder: Document = {
          id: data.id,
          name: data.name,
          is_folder: true,
          is_favorite: false,
          user_id: data.user_id,
          icon: "folder-outline",
          created_at: data.created_at,
          updated_at: data.updated_at,
        }

        addDocument(newFolder)
        onSuccess?.(newFolder)

        Toast.show({
          type: "success",
          text1: "Carpeta creada",
          text2: `La carpeta "${name}" se ha creado correctamente`,
        })

        return true
      } catch (error: any) {
        const errorMsg = error.message || "No se pudo crear la carpeta"
        console.error("Error creating folder:", error)
        onError?.(errorMsg)
        Alert.alert("Error", errorMsg)
        return false
      } finally {
        setProcessing(false)
        setLoading(false)
      }
    },
    [user?.id, addDocument, setLoading, onSuccess, onError],
  )

  // Optimización 3: Editar carpeta/documento
  const editItem = useCallback(
    async (itemId: string, newName: string) => {
      if (!newName.trim()) {
        const errorMsg = "El nombre es obligatorio"
        onError?.(errorMsg)
        Alert.alert("Error", errorMsg)
        return false
      }

      try {
        // Verificar conectividad
        const isOffline = await checkInternetConnection()
        if (isOffline) {
          const errorMsg = "No hay conexión a internet"
          onError?.(errorMsg)
          Toast.show({
            type: "error",
            text1: "Sin conexión",
            text2: "Por favor, verifica tu conexión a internet.",
          })
          return false
        }

        if (!user?.id) {
          const errorMsg = "Usuario no autenticado"
          onError?.(errorMsg)
          Alert.alert("Error", errorMsg)
          return false
        }

        setProcessing(true)
        setLoading(true)

        const { error } = await supabase
          .from("documents")
          .update({ name: newName.trim() })
          .eq("id", itemId)
          .eq("user_id", user.id)

        if (error) throw error

        // Actualizar en el store
        updateDocument({
          id: itemId,
          changes: { name: newName.trim() },
        })

        Toast.show({
          type: "success",
          text1: "Elemento actualizado",
          text2: "El nombre se ha actualizado correctamente",
        })

        return true
      } catch (error: any) {
        const errorMsg = error.message || "No se pudo actualizar el elemento"
        console.error("Error editing item:", error)
        onError?.(errorMsg)
        Alert.alert("Error", errorMsg)
        return false
      } finally {
        setProcessing(false)
        setLoading(false)
      }
    },
    [user?.id, updateDocument, setLoading, onError],
  )

  return {
    processing,
    createFolder,
    editItem,
  }
}
