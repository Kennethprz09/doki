"use client"

import React from "react"
import { memo, useRef, useState, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { CameraView } from "expo-camera"
import * as ImageManipulator from "expo-image-manipulator"

interface CameraModalProps {
  visible: boolean
  onClose: () => void
  onCapture: (photoUri: string) => void
}

const CameraModal: React.FC<CameraModalProps> = memo(({ visible, onClose, onCapture }) => {
  const cameraRef = useRef<CameraView>(null)
  const [capturing, setCapturing] = useState(false)

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || capturing) return

    try {
      setCapturing(true)

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      })

      if (!photo) {
        Alert.alert("Error", "No se pudo tomar la foto")
        return
      }

      const processedImage = await ImageManipulator.manipulateAsync(photo.uri, [{ resize: { width: 1200 } }], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      })

      onCapture(processedImage.uri)
    } catch (error) {
      console.error("Error taking picture:", error)
      Alert.alert("Error", "No se pudo tomar la foto")
    } finally {
      setCapturing(false)
    }
  }, [capturing, onCapture])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back" />

        {/* Header con botón de cerrar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Cerrar cámara">
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Controles de cámara */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.captureButton, capturing && styles.capturingButton]}
            onPress={takePicture}
            disabled={capturing}
            accessibilityLabel="Tomar foto"
          >
            <Ionicons name="camera" size={40} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Feedback de captura */}
        {capturing && <Text style={styles.capturingText}>Procesando imagen...</Text>}
      </View>
    </Modal>
  )
})

CameraModal.displayName = "CameraModal"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  closeButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 25,
    padding: 10,
  },
  controls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  captureButton: {
    backgroundColor: "#ff8c00",
    borderRadius: 40,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  capturingButton: {
    backgroundColor: "#cccccc",
  },
  capturingText: {
    position: "absolute",
    bottom: 150,
    alignSelf: "center",
    color: "#fff",
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1,
  },
})

export default CameraModal
