"use client"

import { useCallback } from "react"
import { Alert, Platform } from "react-native"
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from "expo-sharing"
import * as IntentLauncher from "expo-intent-launcher"
import { supabase } from "../supabase/supabaseClient"
import { useGlobalStore } from "../store/globalStore"

export const useImageViewer = () => {
  const { setLoading } = useGlobalStore()

  // Función para extraer extensión real
  const extractFileExtension = useCallback((fileUrl: string, providedExt?: string): string => {
    if (providedExt && providedExt.includes("/")) {
      providedExt = undefined
    }

    if (providedExt && !providedExt.includes("/")) {
      return providedExt.toLowerCase().replace(".", "")
    }

    const urlParts = fileUrl.split(".")
    if (urlParts.length > 1) {
      const ext = urlParts[urlParts.length - 1].split("?")[0]
      return ext.toLowerCase()
    }

    return ""
  }, [])

  const viewImage = useCallback(
    async (fileUrl: string, fileName?: string, fileExt?: string) => {
      try {
        setLoading(true)

        const realExtension = extractFileExtension(fileUrl, fileExt)

        // Obtener URL firmada
        const { data, error } = await supabase.storage.from("documents").createSignedUrl(fileUrl, 60)

        if (error || !data?.signedUrl) {
          throw new Error("No se pudo obtener la URL firmada.")
        }

        const finalFileName = fileName || fileUrl.split("/").pop() || `image.${realExtension}`
        const localFile = `${FileSystem.cacheDirectory}${finalFileName}`

        // Descargar imagen
        const { uri } = await FileSystem.downloadAsync(data.signedUrl, localFile)

        if (Platform.OS === "android") {
          const contentUri = await FileSystem.getContentUriAsync(uri)

          // Intent específico para galería de imágenes
          try {
            await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
              data: contentUri,
              type: "image/*",
              flags: 1,
              category: "android.intent.category.DEFAULT",
            })
          } catch (galleryError) {
            // Fallback: intent genérico para imágenes
            await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
              data: contentUri,
              type: "image/*",
              flags: 1,
            })
          }
        } else {
          // iOS: usar Quick Look
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              dialogTitle: "Ver imagen",
            })
          } else {
            throw new Error("No se puede ver la imagen en este dispositivo.")
          }
        }

        return { success: true }
      } catch (error) {
        console.error("Error viewing image:", error)
        Alert.alert("Error", "No se pudo abrir la imagen. Asegúrate de tener una aplicación de galería instalada.")
        return { success: false }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, extractFileExtension],
  )

  return { viewImage }
}
