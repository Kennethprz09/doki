"use client"

import { useCallback } from "react"
import { Alert, Platform, Linking } from "react-native"
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from "expo-sharing"
import * as IntentLauncher from "expo-intent-launcher"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "../supabase/supabaseClient"
import { useGlobalStore } from "../store/globalStore"

interface FileOperationResult {
  success: boolean
  error?: string
}

export const useFileOperations = () => {
  const { setLoading } = useGlobalStore()

  // Función para extraer la extensión real del archivo
  const extractFileExtension = useCallback((fileUrl: string, providedExt?: string): string => {
    // Si providedExt parece ser un MIME type, ignorarlo
    if (providedExt && providedExt.includes("/")) {
      providedExt = undefined
    }

    // Si tenemos una extensión válida, usarla
    if (providedExt && !providedExt.includes("/")) {
      return providedExt.toLowerCase().replace(".", "")
    }

    // Extraer extensión de la URL
    const urlParts = fileUrl.split(".")
    if (urlParts.length > 1) {
      const ext = urlParts[urlParts.length - 1].split("?")[0] // Remover query params
      return ext.toLowerCase()
    }

    return ""
  }, [])

  // Función común para obtener URL firmada y descargar archivo
  const downloadFileToCache = useCallback(
    async (fileUrl: string, fileName: string): Promise<{ uri: string; signedUrl: string } | null> => {
      try {
        const { data, error } = await supabase.storage.from("documents").createSignedUrl(fileUrl, 60)

        if (error || !data?.signedUrl) {
          throw new Error("No se pudo obtener la URL firmada.")
        }

        const localFile = `${FileSystem.cacheDirectory}${fileName}`
        const { uri } = await FileSystem.downloadAsync(data.signedUrl, localFile)

        return { uri, signedUrl: data.signedUrl }
      } catch (error) {
        console.error("Error downloading file to cache:", error)
        return null
      }
    },
    [],
  )

  // Función viewFile corregida
  const viewFile = useCallback(
    async (fileUrl?: string, fileExt?: string, fileName?: string): Promise<FileOperationResult> => {
      if (!fileUrl) {
        Alert.alert("Error", "Falta la URL del archivo.")
        return { success: false, error: "Missing file URL" }
      }

      try {
        setLoading(true)

        // Extraer la extensión correcta
        const realExtension = extractFileExtension(fileUrl, fileExt)
        const finalFileName = fileName || fileUrl.split("/").pop() || `tempfile.${realExtension}`
        const mimeType = getMimeType(realExtension)

        const downloadResult = await downloadFileToCache(fileUrl, finalFileName)
        if (!downloadResult) {
          throw new Error("No se pudo descargar el archivo.")
        }


        if (Platform.OS === "android") {
          try {
            const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri)

            // Para imágenes, usar intent específico
            if (mimeType.startsWith("image/")) {
              // Intentar con la galería primero
              try {
                await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
                  data: contentUri,
                  type: mimeType,
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
              // Para otros archivos
              await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
                data: contentUri,
                type: mimeType,
                flags: 1,
              })
            }
          } catch (intentError) {
            console.error("Intent error:", intentError)
            // Fallback: usar sharing
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(downloadResult.uri, {
                dialogTitle: `Abrir ${finalFileName}`,
                mimeType: mimeType,
              })
            } else {
              throw new Error("No se encontró una aplicación para abrir este tipo de archivo.")
            }
          }
        } else {
          // iOS
          const canOpen = await Linking.canOpenURL(downloadResult.uri)
          if (canOpen) {
            await Linking.openURL(downloadResult.uri)
          } else {
            // Fallback para iOS
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(downloadResult.uri, {
                dialogTitle: `Abrir ${finalFileName}`,
              })
            } else {
              throw new Error("No se puede abrir el archivo en este dispositivo.")
            }
          }
        }

        return { success: true }
      } catch (error) {
        console.error("Error viewing file:", error)

        let errorMessage = "No se pudo abrir el archivo."

        if (error instanceof Error) {
          if (error.message.includes("No Activity found")) {
            errorMessage =
              "No se encontró una aplicación para abrir este tipo de archivo. Por favor, instala una aplicación compatible."
          } else if (error.message.includes("Permission")) {
            errorMessage = "No tienes permisos para abrir este archivo."
          } else {
            errorMessage = error.message
          }
        }

        Alert.alert("Error", errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    [downloadFileToCache, setLoading, extractFileExtension],
  )

  // Función optimizada para compartir archivos
  const shareFile = useCallback(
    async (fileUrl?: string, fileName?: string): Promise<FileOperationResult> => {
      if (!fileUrl) {
        Alert.alert("Error", "No se proporcionó una URL válida.")
        return { success: false, error: "No file URL provided" }
      }

      try {
        setLoading(true)

        const finalFileName = fileName || fileUrl.split("/").pop() || "tempfile"

        const downloadResult = await downloadFileToCache(fileUrl, finalFileName)
        if (!downloadResult) {
          throw new Error("No se pudo descargar el archivo.")
        }

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            dialogTitle: "Compartir archivo",
          })
          return { success: true }
        } else {
          throw new Error("No se puede compartir el archivo en este dispositivo.")
        }
      } catch (error) {
        const errorMessage = "No se pudo compartir el archivo."
        console.error("Error sharing file:", error)
        Alert.alert("Error", errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    [downloadFileToCache, setLoading],
  )

  // Función optimizada para descargar archivos
  const downloadFile = useCallback(
    async (fileUrl?: string, fileName?: string, fileExt?: string): Promise<FileOperationResult> => {
      if (!fileUrl || !fileName) {
        Alert.alert("Error", "Falta la URL o el nombre del archivo.")
        return { success: false, error: "Missing required parameters" }
      }

      try {
        setLoading(true)

        const realExtension = extractFileExtension(fileUrl, fileExt)

        const downloadResult = await downloadFileToCache(fileUrl, fileName)
        if (!downloadResult) {
          throw new Error("No se pudo descargar el archivo.")
        }

        if (Platform.OS === "android") {
          return await handleAndroidDownload(downloadResult.uri, fileName, realExtension)
        } else {
          return await handleIOSDownload(downloadResult.uri, fileName)
        }
      } catch (error) {
        const errorMessage = "No se pudo descargar el archivo. Verifica tu conexión o permisos."
        console.error("Error downloading file:", error)
        Alert.alert("Error", errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    [downloadFileToCache, setLoading, extractFileExtension],
  )

  // Manejo específico para Android
  const handleAndroidDownload = async (
    tempUri: string,
    fileName: string,
    fileExt: string,
  ): Promise<FileOperationResult> => {
    try {
      let dirUri = await AsyncStorage.getItem("downloadDirUri")

      if (!dirUri) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()
        if (!permissions.granted) {
          Alert.alert("Permisos denegados", "Se requieren permisos para guardar archivos en Descargas.")
          return { success: false, error: "Permissions denied" }
        }
        dirUri = permissions.directoryUri
        await AsyncStorage.setItem("downloadDirUri", dirUri)
      }

      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(dirUri, fileName, getMimeType(fileExt))

      const fileBase64 = await FileSystem.readAsStringAsync(tempUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, fileBase64, {
        encoding: FileSystem.EncodingType.Base64,
      })

      Alert.alert("Descarga completada", `Archivo guardado en: Descargas/${fileName}`)

      return { success: true }
    } catch (error) {
      throw error
    }
  }

  // Manejo específico para iOS
  const handleIOSDownload = async (tempUri: string, fileName: string): Promise<FileOperationResult> => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempUri, {
          dialogTitle: "Guardar archivo en Descargas",
        })
        Alert.alert("Descarga completada", "Por favor, guarda el archivo en la carpeta Descargas desde el diálogo.")
        return { success: true }
      } else {
        throw new Error("No se puede guardar el archivo en este dispositivo.")
      }
    } catch (error) {
      throw error
    }
  }

  // Función getMimeType mejorada
  const getMimeType = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
      // Imágenes
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      tiff: "image/tiff",
      tif: "image/tiff",

      // Documentos
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

      // Texto
      txt: "text/plain",
      rtf: "application/rtf",
      csv: "text/csv",

      // Audio
      mp3: "audio/mpeg",
      wav: "audio/wav",
      m4a: "audio/mp4",
      aac: "audio/aac",

      // Video
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      wmv: "video/x-ms-wmv",

      // Archivos comprimidos
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
    }

    const cleanExt = extension.toLowerCase().replace(".", "")
    const mimeType = mimeTypes[cleanExt] || "application/octet-stream"

    return mimeType
  }

  return {
    viewFile,
    shareFile,
    downloadFile,
  }
}
