"use client"

import type React from "react"
import { memo, useState, useCallback } from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImageManipulator from "expo-image-manipulator"
import BaseModal from "../common/BaseModal"
import LoadingButton from "../common/LoadingButton"

interface PhotoPreviewModalProps {
  visible: boolean
  onClose: () => void
  frontPhoto: string | null
  backPhoto: string | null
  onRetakeFront: () => void
  onRetakeBack: () => void
  onSave: () => Promise<boolean>
  onUpdateFrontPhoto: (uri: string) => void
  onUpdateBackPhoto: (uri: string) => void
}

// Optimización 1: Modal de previsualización optimizado
const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = memo(
  ({
    visible,
    onClose,
    frontPhoto,
    backPhoto,
    onRetakeFront,
    onRetakeBack,
    onSave,
    onUpdateFrontPhoto,
    onUpdateBackPhoto,
  }) => {
    const [saving, setSaving] = useState(false)

    // Optimización 2: Función para rotar imagen
    const rotateImage = useCallback(
      async (target: "front" | "back", angle: number) => {
        const uri = target === "front" ? frontPhoto : backPhoto
        if (!uri) return

        try {
          const result = await ImageManipulator.manipulateAsync(uri, [{ rotate: angle }], {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          })

          if (target === "front") {
            onUpdateFrontPhoto(result.uri)
          } else {
            onUpdateBackPhoto(result.uri)
          }
        } catch (error) {
          console.error("Error rotating image:", error)
          Alert.alert("Error", "No se pudo rotar la imagen")
        }
      },
      [frontPhoto, backPhoto, onUpdateFrontPhoto, onUpdateBackPhoto],
    )

    // Optimización 3: Función para guardar
    const handleSave = useCallback(async () => {
      setSaving(true)
      const success = await onSave()
      setSaving(false)

      if (success) {
        onClose()
      }
    }, [onSave, onClose])

    // Optimización 4: Render de sección de foto
    const renderPhotoSection = useCallback(
      (label: string, uri: string | null, onRetake: () => void, target: "front" | "back") => {
        if (!uri) return null

        return (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>{label}</Text>
            <Image source={{ uri }} style={styles.previewImage} />

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
                <Text style={styles.retakeText}>Repetir</Text>
              </TouchableOpacity>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => rotateImage(target, -90)}
                  accessibilityLabel="Rotar izquierda"
                >
                  <Ionicons name="arrow-undo-sharp" size={20} color="#007bff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => rotateImage(target, 90)}
                  accessibilityLabel="Rotar derecha"
                >
                  <Ionicons name="arrow-redo-sharp" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )
      },
      [rotateImage],
    )

    return (
      <BaseModal visible={visible} onClose={onClose} animationType="slide">
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Previsualización del Documento</Text>

            {renderPhotoSection("Foto Frontal", frontPhoto, onRetakeFront, "front")}
            {renderPhotoSection("Foto Trasera", backPhoto, onRetakeBack, "back")}

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <LoadingButton
                title="Guardar PDF"
                onPress={handleSave}
                loading={saving}
                disabled={!frontPhoto}
                style={styles.saveButton}
              />
            </View>
          </ScrollView>
        </View>
      </BaseModal>
    )
  },
)

PhotoPreviewModal.displayName = "PhotoPreviewModal"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: "Karla-Bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  photoSection: {
    marginBottom: 24,
  },
  photoLabel: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#333",
    marginBottom: 8,
  },
  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  retakeButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retakeText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Karla-SemiBold",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 8,
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
  },
  saveButton: {
    flex: 2,
  },
})

export default PhotoPreviewModal
