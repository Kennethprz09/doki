"use client"

import type React from "react"
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

// Optimización 1: Modal de crear/editar carpeta optimizado con mejor tamaño
const CreateFolderModal: React.FC<CreateFolderModalProps> = memo(
  ({ visible, onClose, onSubmit, editItem = null, loading = false }) => {
    const [folderName, setFolderName] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // Optimización 2: Determinar si es edición o creación
    const isEditing = Boolean(editItem?.id)
    const title = isEditing ? (editItem?.is_folder ? "Editar carpeta" : "Editar archivo") : "Crear carpeta"

    // Optimización 3: Cargar nombre existente al editar
    useEffect(() => {
      if (visible && editItem?.name) {
        setFolderName(editItem.name)
      } else if (visible && !editItem) {
        setFolderName("")
      }
    }, [visible, editItem])

    // Optimización 4: Función para manejar envío
    const handleSubmit = useCallback(async () => {
      if (!folderName.trim()) return

      setSubmitting(true)
      const success = await onSubmit(folderName.trim())
      setSubmitting(false)

      if (success) {
        setFolderName("")
        onClose()
      }
    }, [folderName, onSubmit, onClose])

    // Optimización 5: Función para cerrar modal
    const handleClose = useCallback(() => {
      setFolderName("")
      onClose()
    }, [onClose])

    return (
      <BaseModal visible={visible} onClose={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>

            <TextInput
              style={styles.input}
              placeholder={isEditing ? "Nuevo nombre" : "Nombre de la carpeta"}
              value={folderName}
              onChangeText={setFolderName}
              placeholderTextColor="#a3a3a3"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

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
  input: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12, // Bordes más redondeados
    paddingHorizontal: 20, // Más padding
    paddingVertical: 16, // Más padding vertical
    fontSize: 18, // Texto más grande
    fontFamily: "Karla-Regular",
    color: "#333",
    marginBottom: 32, // Más espacio
    backgroundColor: "#f8f9fa",
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
