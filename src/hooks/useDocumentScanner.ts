"use client"

import { useCallback, useState } from "react"
import { Alert } from "react-native"
import Toast from "react-native-toast-message"
import * as FileSystem from "expo-file-system"
import * as Print from "expo-print"
import { Buffer } from "buffer"
import { Camera } from "expo-camera"
import { useUserStore } from "../store/userStore"
import { useDocumentsStore } from "../store/documentsStore"
import { useGlobalStore } from "../store/globalStore"
import { checkInternetConnection } from "../utils/actions"
import { supabase } from "../supabase/supabaseClient"
import type { Document } from "../components/types"

interface UseDocumentScannerProps {
  folderId?: string | null
  onSuccess?: (document: Document) => void
  onError?: (error: string) => void
}

interface ScanState {
  frontPhoto: string | null
  backPhoto: string | null
  isCapturingBack: boolean
}

// Optimización 1: Hook para escaneo de documentos
export const useDocumentScanner = ({ folderId, onSuccess, onError }: UseDocumentScannerProps = {}) => {
  const user = useUserStore((state) => state.user)
  const { addDocument } = useDocumentsStore()
  const { setLoading } = useGlobalStore()
  const [scanning, setScanning] = useState(false)
  const [scanState, setScanState] = useState<ScanState>({
    frontPhoto: null,
    backPhoto: null,
    isCapturingBack: false,
  })

  // Optimización 2: Solicitar permisos de cámara
  const requestCameraPermission = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceso a la cámara para escanear documentos.")
        return false
      }
      return true
    } catch (error) {
      console.error("Error requesting camera permission:", error)
      return false
    }
  }, [])

  // Optimización 3: Actualizar foto frontal
  const setFrontPhoto = useCallback((uri: string) => {
    setScanState((prev) => ({ ...prev, frontPhoto: uri }))
  }, [])

  // Optimización 4: Actualizar foto trasera
  const setBackPhoto = useCallback((uri: string) => {
    setScanState((prev) => ({ ...prev, backPhoto: uri }))
  }, [])

  // Optimización 5: Alternar modo de captura
  const setIsCapturingBack = useCallback((capturing: boolean) => {
    setScanState((prev) => ({ ...prev, isCapturingBack: capturing }))
  }, [])

  // Optimización 6: Reiniciar estado de escaneo
  const resetScanState = useCallback(() => {
    setScanState({
      frontPhoto: null,
      backPhoto: null,
      isCapturingBack: false,
    })
  }, [])

  // Optimización 7: Generar PDF desde fotos
  const generatePDF = useCallback(async () => {
    if (!scanState.frontPhoto) {
      const errorMsg = "La foto frontal es obligatoria"
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

      setScanning(true)
      setLoading(true)

      // Leer imágenes como Base64
      const frontPhotoBase64 = await FileSystem.readAsStringAsync(scanState.frontPhoto, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const backPhotoBase64 = scanState.backPhoto
        ? await FileSystem.readAsStringAsync(scanState.backPhoto, {
            encoding: FileSystem.EncodingType.Base64,
          })
        : null

      // Crear HTML con imágenes incrustadas
      const htmlContent = `
        <html>
          <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="text-align: center; color: #333;">Documento Escaneado</h1>
            <div style="text-align: center; margin: 20px 0;">
              <img src="data:image/jpeg;base64,${frontPhotoBase64}" 
                   style="width: 100%; max-width: 500px; margin-bottom: 20px; border: 1px solid #ddd;" />
              ${
                backPhotoBase64
                  ? `<img src="data:image/jpeg;base64,${backPhotoBase64}" 
                         style="width: 100%; max-width: 500px; border: 1px solid #ddd;" />`
                  : ""
              }
            </div>
            <p style="text-align: center; color: #666; font-size: 12px;">
              Generado el ${new Date().toLocaleDateString()}
            </p>
          </body>
        </html>
      `

      // Generar PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true,
      })

      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Subir PDF
      const fileName = `scanned_${Date.now()}.pdf`
      const filePath = `${user.id}/${fileName}`
      const fileData = Buffer.from(fileContent, "base64")

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, fileData, {
        contentType: "application/pdf",
      })

      if (uploadError) throw uploadError

      // Guardar en base de datos
      const { data, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            name: fileName,
            size: fileContent.length,
            ext: "application/pdf",
            user_id: user.id,
            folder_id: folderId || null,
            is_folder: false,
            path: filePath,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Crear documento para el store
      const newDocument: Document = {
        id: data.id,
        name: data.name,
        folder_id: data.folder_id,
        is_favorite: false,
        is_folder: data.is_folder,
        path: data.path,
        size: data.size,
        ext: data.ext,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      addDocument(newDocument)
      onSuccess?.(newDocument)

      Toast.show({
        type: "success",
        text1: "Documento escaneado",
        text2: "El documento se ha guardado como PDF",
      })

      resetScanState()
      return true
    } catch (error: any) {
      const errorMsg = error.message || "No se pudo generar el PDF"
      console.error("Error generating PDF:", error)
      onError?.(errorMsg)
      Alert.alert("Error", errorMsg)
      return false
    } finally {
      setScanning(false)
      setLoading(false)
    }
  }, [scanState, user?.id, folderId, addDocument, setLoading, onSuccess, onError, resetScanState])

  return {
    // Estado
    scanState,
    scanning,

    // Funciones de estado
    setFrontPhoto,
    setBackPhoto,
    setIsCapturingBack,
    resetScanState,

    // Funciones principales
    requestCameraPermission,
    generatePDF,
  }
}
