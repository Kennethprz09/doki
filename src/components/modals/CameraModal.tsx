import React from "react"
import { memo, useRef, useState, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { CameraView } from "expo-camera"
import * as ImageManipulator from "expo-image-manipulator"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import { colors, fonts, radii, withAlpha } from "../../theme"
import BaseModal from "../common/BaseModal"

interface CameraModalProps {
  visible: boolean
  onClose: () => void
  onCapture: (photoUri: string) => void
}

const CameraModal: React.FC<CameraModalProps> = memo(({ visible, onClose, onCapture }) => {
  const cameraRef = useRef<CameraView>(null)
  const [capturing, setCapturing] = useState(false)
  const insets = useSafeAreaInsets()

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || capturing) return

    try {
      setCapturing(true)
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: false })

      if (!photo) {
        Toast.show({ type: "error", text1: "Error", text2: "No se pudo tomar la foto" })
        return
      }

      const processed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      )

      onCapture(processed.uri)
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "No se pudo tomar la foto" })
    } finally {
      setCapturing(false)
    }
  }, [capturing, onCapture])

  return (
    <BaseModal visible={visible} onClose={onClose} animationType="fade" fullScreen>
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back" />

        {/* Top controls */}
        <View style={[styles.topBar, { top: insets.top + 10 }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose} accessibilityLabel="Cerrar cámara">
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={[styles.bottomBar, { bottom: Math.max(insets.bottom, 20) + 24 }]}>
          <TouchableOpacity
            style={[styles.captureBtn, capturing && styles.capturingBtn]}
            onPress={takePicture}
            disabled={capturing}
            accessibilityLabel="Tomar foto"
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>

        {capturing && (
          <View style={styles.processingBadge}>
            <Text style={styles.processingText}>Procesando...</Text>
          </View>
        )}
      </View>
    </BaseModal>
  )
})

CameraModal.displayName = "CameraModal"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: { flex: 1 },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
  },
  capturingBtn: {
    opacity: 0.5,
  },
  processingBadge: {
    position: "absolute",
    bottom: 160,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    zIndex: 2,
  },
  processingText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
})

export default CameraModal
