"use client"

import React from "react"
import { memo, useState, useEffect, useCallback } from "react"
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from "react-native"
import BaseModal from "../common/BaseModal"
import LoadingButton from "../common/LoadingButton"
import type { Document } from "../types"

const { width } = Dimensions.get("window")

interface CreateFolderModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<boolean>
  editItem?: Document | null
  loading?: boolean
}

// Utilidades para manejar extensiones de archivos
const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".")
  if (lastDotIndex === -1 || lastDotIndex === 0) return ""
  return filename.substring(lastDotIndex)
}

const getFileNameWithoutExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".")
  if (lastDotIndex === -1 || lastDotIndex === 0) return filename
  return filename.substring(0, lastDotIndex)
}

// Optimización 1: Modal de crear/editar carpeta optimizado con mejor tamaño
const CreateFolderModal: React.FC<CreateFolderModalProps> = memo(
  ({ visible, onClose, onSubmit, editItem = null, loading = false }) => {
    const [folderName, setFolderName] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [originalExtension, setOriginalExtension] = useState("") // ⭐ Guardar extensión original

    // Optimización 2: Determinar si es edición o creación
    const isEditing = Boolean(editItem?.id)
    const isEditingFile = isEditing && !editItem?.is_folder // ⭐ Detectar si es archivo
    const title = isEditing ? (editItem?.is_folder ? "Editar carpeta" : "Editar archivo") : "Crear carpeta"

    // Optimización 3: Cargar nombre existente al editar
    useEffect(() => {
      if (visible && editItem?.name) {
        if (isEditingFile) {
          // ⭐ Si es un archivo, extraer extensión y mostrar solo el nombre
          const extension = getFileExtension(editItem.name)
          const nameWithoutExtension = getFileNameWithoutExtension(editItem.name)
          setOriginalExtension(extension)
          setFolderName(nameWithoutExtension)
        } else {
          // Si es carpeta, mostrar nombre completo
          setFolderName(editItem.name)
          setOriginalExtension("")
        }
      } else if (visible && !editItem) {
        setFolderName("")
        setOriginalExtension("")
      }
    }, [visible, editItem, isEditingFile])

    // Optimización 4: Función para manejar envío
    const handleSubmit = useCallback(async () => {
      if (!folderName.trim()) return

      setSubmitting(true)

      // ⭐ Si es un archivo, agregar la extensión original de vuelta
      const finalName = isEditingFile ? `${folderName.trim()}${originalExtension}` : folderName.trim()

      const success = await onSubmit(finalName)
      setSubmitting(false)

      if (success) {
        setFolderName("")
        setOriginalExtension("")
        onClose()
      }
    }, [folderName, onSubmit, onClose, isEditingFile, originalExtension])

    // Optimización 5: Función para cerrar modal
    const handleClose = useCallback(() => {
      setFolderName("")
      setOriginalExtension("")
      onClose()
    }, [onClose])

    // ⭐ Placeholder dinámico basado en el tipo
    const getPlaceholder = () => {
      if (isEditing) {
        return isEditingFile ? "Nuevo nombre del archivo" : "Nuevo nombre de la carpeta"
      }
      return "Nombre de la carpeta"
    }

    return (
      <BaseModal visible={visible} onClose={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>

            {/* ⭐ Mostrar información sobre la extensión si es archivo */}
            {isEditingFile && originalExtension && (
              <View style={styles.extensionInfo}>
                <Text style={styles.extensionText}>
                  Extensión: <Text style={styles.extensionHighlight}>{originalExtension}</Text>
                </Text>
                <Text style={styles.extensionNote}>La extensión se mantendrá automáticamente</Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={getPlaceholder()}
              value={folderName}
              onChangeText={setFolderName}
              placeholderTextColor="#a3a3a3"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {/* ⭐ Preview del nombre final si es archivo */}
            {isEditingFile && folderName.trim() && originalExtension && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Nombre final:</Text>
                <Text style={styles.previewText}>
                  {folderName.trim()}
                  <Text style={styles.previewExtension}>{originalExtension}</Text>
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <LoadingButton
                title="Cancelar"
                onPress={handleClose}
                variant="ghost"
                style={styles.cancelButton}
                disabled={submitting || loading}
              />

              <LoadingButton
                title={isEditing ? "Guardar" : "Crear"}
                onPress={handleSubmit}
                loading={submitting || loading}
                disabled={!folderName.trim()}
                style={styles.submitButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </BaseModal>
    )
  },
)

CreateFolderModal.displayName = "CreateFolderModal"

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: width * 0.9, // 90% del ancho de pantalla
    maxWidth: 450, // Máximo más grande
    backgroundColor: "#fff",
    borderRadius: 20, // Bordes más redondeados
    padding: 32, // Más padding
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 22, // Título más grande
    fontFamily: "Karla-Bold",
    color: "#333",
    marginBottom: 28, // Más espacio
    textAlign: "center",
  },
  // ⭐ Estilos para información de extensión
  extensionInfo: {
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#ff8c00",
  },
  extensionText: {
    fontSize: 14,
    fontFamily: "Karla-SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  extensionHighlight: {
    color: "#ff8c00",
    fontFamily: "Karla-Bold",
  },
  extensionNote: {
    fontSize: 12,
    fontFamily: "Karla-Regular",
    color: "#666",
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12, // Bordes más redondeados
    paddingHorizontal: 20, // Más padding
    paddingVertical: 16, // Más padding vertical
    fontSize: 18, // Texto más grande
    fontFamily: "Karla-Regular",
    color: "#333",
    marginBottom: 16, // Reducido para hacer espacio al preview
    backgroundColor: "#f8f9fa",
  },
  // ⭐ Estilos para preview del nombre final
  previewContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: "Karla-SemiBold",
    color: "#666",
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
    color: "#333",
  },
  previewExtension: {
    color: "#ff8c00",
    fontFamily: "Karla-Bold",
  },
  actions: {
    flexDirection: "row",
    gap: 16, // Más espacio entre botones
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16, // Botones más grandes
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16, // Botones más grandes
  },
})

export default CreateFolderModal
