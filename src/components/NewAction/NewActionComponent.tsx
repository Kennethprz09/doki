"use client"

import type React from "react"
import { memo, useState, useCallback } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { useFileUpload } from "../../hooks/useFileUpload"
import { useDocumentScanner } from "../../hooks/useDocumentScanner"
import { useFolderManager } from "../../hooks/useFolderManager"
import NewActionButton from "./NewActionButton"
import type { Document } from "../types"
import ActionOptionsModal from "../modals/ActionOptionsModal"
import CameraModal from "../modals/CameraModal"
import PhotoPreviewModal from "../modals/PhotoPreviewModal"
import CreateFolderModal from "../modals/CreateFolderModal"

interface NewActionComponentProps {
  folder?: { folder?: Partial<Document> }
}

// Optimización 1: Componente principal optimizado
const NewActionComponent: React.FC<NewActionComponentProps> = memo(({ folder }) => {
  // Estados de modales
  const [showOptions, setShowOptions] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  // Hooks personalizados
  const { uploadFile, uploading } = useFileUpload({
    folderId: folder?.folder?.id,
  })

  const {
    scanState,
    scanning,
    setFrontPhoto,
    setBackPhoto,
    setIsCapturingBack,
    resetScanState,
    requestCameraPermission,
    generatePDF,
  } = useDocumentScanner({
    folderId: folder?.folder?.id,
  })

  const { createFolder, processing } = useFolderManager()

  // Optimización 2: Función para manejar captura de foto
  const handlePhotoCapture = useCallback(
    (photoUri: string) => {
      if (scanState.isCapturingBack) {
        setBackPhoto(photoUri)
        setShowCamera(false)
        setShowPreview(true)
      } else {
        setFrontPhoto(photoUri)
        // Preguntar si quiere tomar foto trasera
        Alert.alert("¿Tomar foto trasera?", "¿Deseas tomar una foto de la parte trasera del documento?", [
          {
            text: "No",
            onPress: () => {
              setShowCamera(false)
              setShowPreview(true)
            },
          },
          {
            text: "Sí",
            onPress: () => {
              setIsCapturingBack(true)
            },
          },
        ])
      }
    },
    [scanState.isCapturingBack, setFrontPhoto, setBackPhoto, setIsCapturingBack],
  )

  // Optimización 3: Función para reiniciar escaneo
  const handleRetakeFront = useCallback(() => {
    setFrontPhoto("")
    setIsCapturingBack(false)
    setShowPreview(false)
    setShowCamera(true)
  }, [setFrontPhoto, setIsCapturingBack])

  const handleRetakeBack = useCallback(() => {
    setBackPhoto("")
    setIsCapturingBack(true)
    setShowPreview(false)
    setShowCamera(true)
  }, [setBackPhoto, setIsCapturingBack])

  // Optimización 4: Función para iniciar escaneo
  const handleStartScan = useCallback(async () => {
    const hasPermission = await requestCameraPermission()
    if (!hasPermission) return

    resetScanState()
    setShowCamera(true)
  }, [requestCameraPermission, resetScanState])

  // Optimización 5: Función para guardar PDF
  const handleSavePDF = useCallback(async () => {
    const success = await generatePDF()
    if (success) {
      setShowPreview(false)
      resetScanState()
    }
    return success
  }, [generatePDF, resetScanState])

  // Optimización 6: Función para crear carpeta
  const handleCreateFolder = useCallback(
    async (name: string) => {
      const success = await createFolder(name)
      return success
    },
    [createFolder],
  )

  // Optimización 7: Opciones del modal
  const actionOptions = [
    ...(folder?.folder?.id
      ? []
      : [
          {
            id: "folder",
            label: "Carpeta",
            icon: "folder-outline" as const,
            onPress: () => setShowCreateFolder(true),
          },
        ]),
    {
      id: "file",
      label: "Archivo",
      icon: "cloud-upload-outline" as const,
      onPress: uploadFile,
    },
    {
      id: "scan",
      label: "Escanear",
      icon: "scan-outline" as const,
      onPress: handleStartScan,
    },
  ]

  const isDisabled = uploading || scanning || processing

  return (
    <View style={styles.container}>
      {/* Botón principal */}
      <NewActionButton onPress={() => setShowOptions(true)} disabled={isDisabled} />

      {/* Modal de opciones */}
      <ActionOptionsModal visible={showOptions} onClose={() => setShowOptions(false)} options={actionOptions} />

      {/* Modal de cámara */}
      <CameraModal
        visible={showCamera}
        onClose={() => {
          setShowCamera(false)
          resetScanState()
        }}
        onCapture={handlePhotoCapture}
      />

      {/* Modal de previsualización */}
      <PhotoPreviewModal
        visible={showPreview}
        onClose={() => {
          setShowPreview(false)
          resetScanState()
        }}
        frontPhoto={scanState.frontPhoto}
        backPhoto={scanState.backPhoto}
        onRetakeFront={handleRetakeFront}
        onRetakeBack={handleRetakeBack}
        onSave={handleSavePDF}
        onUpdateFrontPhoto={setFrontPhoto}
        onUpdateBackPhoto={setBackPhoto}
      />

      {/* Modal de crear carpeta */}
      <CreateFolderModal
        visible={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSubmit={handleCreateFolder}
        loading={processing}
      />
    </View>
  )
})

NewActionComponent.displayName = "NewActionComponent"

const styles = StyleSheet.create({
  container: {
    flex: 0.17,
    backgroundColor: "transparent",
  },
})

export default NewActionComponent
