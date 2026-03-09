import React from "react"
import { memo, useState, useCallback } from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImageManipulator from "expo-image-manipulator"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import { colors, fonts, radii, shadows, withAlpha } from "../../theme"
import BaseModal from "../common/BaseModal"
import LoadingButton from "../common/LoadingButton"
import SimpleCropper from "./SimpleCropper"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.50)

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
    const [showCropper, setShowCropper] = useState(false)
    const [cropTarget, setCropTarget] = useState<"front" | "back" | null>(null)
    const [cropKey, setCropKey] = useState(0)
    const [activeTab, setActiveTab] = useState<"front" | "back">("front")
    const insets = useSafeAreaInsets()

    const hasBothPhotos = !!frontPhoto && !!backPhoto
    const activeUri = activeTab === "front" ? frontPhoto : backPhoto
    const onRetakeActive = activeTab === "front" ? onRetakeFront : onRetakeBack

    const rotateImage = useCallback(
      async (angle: number) => {
        const uri = activeTab === "front" ? frontPhoto : backPhoto
        if (!uri) return
        try {
          const result = await ImageManipulator.manipulateAsync(uri, [{ rotate: angle }], {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
          })
          activeTab === "front" ? onUpdateFrontPhoto(result.uri) : onUpdateBackPhoto(result.uri)
        } catch {
          Toast.show({ type: "error", text1: "Error", text2: "No se pudo rotar la imagen" })
        }
      },
      [activeTab, frontPhoto, backPhoto, onUpdateFrontPhoto, onUpdateBackPhoto],
    )

    const startCrop = useCallback(() => {
      setCropTarget(activeTab)
      setCropKey((prev) => prev + 1)
      setShowCropper(true)
    }, [activeTab])

    const handleCropComplete = useCallback(
      (croppedUri: string) => {
        if (!cropTarget) return
        cropTarget === "front" ? onUpdateFrontPhoto(croppedUri) : onUpdateBackPhoto(croppedUri)
        setShowCropper(false)
        setCropTarget(null)
      },
      [cropTarget, onUpdateFrontPhoto, onUpdateBackPhoto],
    )

    const handleCropCancel = useCallback(() => {
      setShowCropper(false)
      setCropTarget(null)
    }, [])

    const handleSave = useCallback(async () => {
      setSaving(true)
      const success = await onSave()
      setSaving(false)
      if (success) onClose()
      return success
    }, [onSave, onClose])

    const cropImageUri = cropTarget === "front" ? frontPhoto : backPhoto

    return (
      <BaseModal visible={visible} onClose={onClose} animationType="fade" fullScreen>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {showCropper && cropTarget && cropImageUri ? (
            <SimpleCropper
              key={cropKey}
              imageUri={cropImageUri}
              onCrop={handleCropComplete}
              onCancel={handleCropCancel}
              onReady={() => {}}
            />
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Cerrar">
                  <Ionicons name="close" size={20} color={colors.gray700} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Revisión</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Tabs — solo si hay ambas fotos */}
              {hasBothPhotos && (
                <View style={styles.tabRow}>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === "front" && styles.tabActive]}
                    onPress={() => setActiveTab("front")}
                  >
                    <Ionicons
                      name="card-outline"
                      size={14}
                      color={activeTab === "front" ? colors.primary : colors.gray400}
                    />
                    <Text style={[styles.tabText, activeTab === "front" && styles.tabTextActive]}>
                      Frontal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === "back" && styles.tabActive]}
                    onPress={() => setActiveTab("back")}
                  >
                    <Ionicons
                      name="card-outline"
                      size={14}
                      color={activeTab === "back" ? colors.primary : colors.gray400}
                      style={{ transform: [{ scaleX: -1 }] }}
                    />
                    <Text style={[styles.tabText, activeTab === "back" && styles.tabTextActive]}>
                      Trasera
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Imagen grande */}
              <View style={styles.imageArea}>
                {activeUri ? (
                  <Image
                    source={{ uri: activeUri }}
                    style={[styles.previewImage, { height: IMAGE_HEIGHT }]}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.imagePlaceholder, { height: IMAGE_HEIGHT }]}>
                    <Ionicons name="image-outline" size={48} color={colors.gray300} />
                    <Text style={styles.placeholderText}>Sin foto</Text>
                  </View>
                )}

                {/* Badge de cara */}
                <View style={styles.faceBadge}>
                  <Text style={styles.faceBadgeText}>
                    {hasBothPhotos ? (activeTab === "front" ? "Cara frontal" : "Cara trasera") : "Cara frontal"}
                  </Text>
                </View>
              </View>

              {/* Acciones */}
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => rotateImage(-90)}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="refresh-outline" size={20} color={colors.gray700} />
                  </View>
                  <Text style={styles.actionLabel}>Girar ←</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => rotateImage(90)}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="refresh-outline" size={20} color={colors.gray700} style={{ transform: [{ scaleX: -1 }] }} />
                  </View>
                  <Text style={styles.actionLabel}>Girar →</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={startCrop}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="crop-outline" size={20} color={colors.gray700} />
                  </View>
                  <Text style={styles.actionLabel}>Recortar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={onRetakeActive}>
                  <View style={[styles.actionIcon, styles.actionIconRetake]}>
                    <Ionicons name="camera-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.primary }]}>Repetir</Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <LoadingButton
                  title="Guardar PDF"
                  onPress={handleSave}
                  loading={saving}
                  disabled={!frontPhoto}
                  style={styles.saveBtn}
                />
              </View>
            </>
          )}
        </View>
      </BaseModal>
    )
  },
)

PhotoPreviewModal.displayName = "PhotoPreviewModal"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.gray900,
  },
  // Tabs
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.surface,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: radii.lg,
    backgroundColor: colors.gray100,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  tabActive: {
    backgroundColor: withAlpha(colors.primary, 10),
    borderColor: withAlpha(colors.primary, 40),
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.gray400,
  },
  tabTextActive: {
    color: colors.primary,
  },
  // Image
  imageArea: {
    flex: 1,
    backgroundColor: "#111",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray400,
  },
  faceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  faceBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  // Actions
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconRetake: {
    backgroundColor: withAlpha(colors.primary, 12),
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.gray600,
  },
  // Footer
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray100,
    borderRadius: radii.lg,
    paddingVertical: 13,
  },
  cancelText: {
    color: colors.gray600,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  saveBtn: { flex: 2, paddingVertical: 13 },
})

export default PhotoPreviewModal
