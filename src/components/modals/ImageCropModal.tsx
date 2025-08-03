"use client"

import React from "react"
import { memo, useState, useCallback, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Image, PanResponder } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImageManipulator from "expo-image-manipulator"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

interface ImageCropModalProps {
  visible: boolean
  onClose: () => void
  imageUri: string
  onCropComplete: (croppedUri: string) => void
}

const ImageCropModal: React.FC<ImageCropModalProps> = memo(({ visible, onClose, imageUri, onCropComplete }) => {
  const [processing, setProcessing] = useState(false)
  const [cropArea, setCropArea] = useState({
    x: 50,
    y: 150,
    width: screenWidth - 100,
    height: 300,
  })
  const [activeGesture, setActiveGesture] = useState<string | null>(null)
  const [imageLayout, setImageLayout] = useState({
    imageWidth: 0,
    imageHeight: 0,
    displayWidth: 0,
    displayHeight: 0,
    offsetX: 0,
    offsetY: 0,
  })

  // Constantes
  const MARGIN = 20
  const HEADER_HEIGHT = 100
  const FOOTER_HEIGHT = 160 // Aumentado para incluir controles
  const MIN_SIZE = 100

  // Calcular el layout real de la imagen
  useEffect(() => {
    if (!imageUri) return

    const calculateImageLayout = async () => {
      try {
        const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {})
        const containerWidth = screenWidth
        const containerHeight = screenHeight - HEADER_HEIGHT - FOOTER_HEIGHT

        // Calcular cómo se muestra la imagen con resizeMode="contain"
        const imageAspectRatio = imageInfo.width / imageInfo.height
        const containerAspectRatio = containerWidth / containerHeight

        let displayWidth, displayHeight, offsetX, offsetY

        if (imageAspectRatio > containerAspectRatio) {
          // La imagen es más ancha, se ajusta al ancho del contenedor
          displayWidth = containerWidth
          displayHeight = containerWidth / imageAspectRatio
          offsetX = 0
          offsetY = (containerHeight - displayHeight) / 2
        } else {
          // La imagen es más alta, se ajusta a la altura del contenedor
          displayHeight = containerHeight
          displayWidth = containerHeight * imageAspectRatio
          offsetX = (containerWidth - displayWidth) / 2
          offsetY = 0
        }

        setImageLayout({
          imageWidth: imageInfo.width,
          imageHeight: imageInfo.height,
          displayWidth,
          displayHeight,
          offsetX,
          offsetY: offsetY + HEADER_HEIGHT, // Agregar offset del header
        })

        // Ajustar el área de recorte inicial para que esté dentro de la imagen
        setCropArea({
          x: Math.max(MARGIN, offsetX + 20),
          y: Math.max(HEADER_HEIGHT + 20, offsetY + HEADER_HEIGHT + 20),
          width: Math.min(displayWidth - 40, screenWidth - 100),
          height: Math.min(displayHeight - 40, 300),
        })
      } catch (error) {
        console.error("Error calculating image layout:", error)
      }
    }

    calculateImageLayout()
  }, [imageUri])

  // PanResponder mejorado con límites basados en la imagen real
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      const cornerSize = 30

      if (locationX < cornerSize && locationY < cornerSize) {
        setActiveGesture("topLeft")
      } else if (locationX > cropArea.width - cornerSize && locationY < cornerSize) {
        setActiveGesture("topRight")
      } else if (locationX < cornerSize && locationY > cropArea.height - cornerSize) {
        setActiveGesture("bottomLeft")
      } else if (locationX > cropArea.width - cornerSize && locationY > cropArea.height - cornerSize) {
        setActiveGesture("bottomRight")
      } else {
        setActiveGesture("move")
      }
    },

    onPanResponderMove: (evt, gesture) => {
      if (!activeGesture || !imageLayout.displayWidth) return

      const { dx, dy } = gesture
      const sensitivity = 1

      // Límites basados en la imagen real
      const minX = imageLayout.offsetX
      const maxX = imageLayout.offsetX + imageLayout.displayWidth
      const minY = imageLayout.offsetY
      const maxY = imageLayout.offsetY + imageLayout.displayHeight

      setCropArea((prev) => {
        let newArea = { ...prev }

        switch (activeGesture) {
          case "move":
            const newX = Math.max(minX, Math.min(maxX - prev.width, prev.x + dx * sensitivity))
            const newY = Math.max(minY, Math.min(maxY - prev.height, prev.y + dy * sensitivity))
            newArea = { ...prev, x: newX, y: newY }
            break

          case "topLeft":
            const tlNewX = Math.max(minX, Math.min(prev.x + prev.width - MIN_SIZE, prev.x + dx * sensitivity))
            const tlNewY = Math.max(minY, Math.min(prev.y + prev.height - MIN_SIZE, prev.y + dy * sensitivity))
            newArea = {
              x: tlNewX,
              y: tlNewY,
              width: prev.width - (tlNewX - prev.x),
              height: prev.height - (tlNewY - prev.y),
            }
            break

          case "topRight":
            const trNewY = Math.max(minY, Math.min(prev.y + prev.height - MIN_SIZE, prev.y + dy * sensitivity))
            const trNewWidth = Math.max(MIN_SIZE, Math.min(maxX - prev.x, prev.width + dx * sensitivity))
            newArea = {
              ...prev,
              y: trNewY,
              width: trNewWidth,
              height: prev.height - (trNewY - prev.y),
            }
            break

          case "bottomLeft":
            const blNewX = Math.max(minX, Math.min(prev.x + prev.width - MIN_SIZE, prev.x + dx * sensitivity))
            const blNewHeight = Math.max(MIN_SIZE, Math.min(maxY - prev.y, prev.height + dy * sensitivity))
            newArea = {
              x: blNewX,
              y: prev.y,
              width: prev.width - (blNewX - prev.x),
              height: blNewHeight,
            }
            break

          case "bottomRight":
            const brNewWidth = Math.max(MIN_SIZE, Math.min(maxX - prev.x, prev.width + dx * sensitivity))
            const brNewHeight = Math.max(MIN_SIZE, Math.min(maxY - prev.y, prev.height + dy * sensitivity))
            newArea = {
              ...prev,
              width: brNewWidth,
              height: brNewHeight,
            }
            break
        }

        return newArea
      })
    },

    onPanResponderRelease: () => {
      setActiveGesture(null)
    },
  })

  const handleCrop = useCallback(async () => {
    if (!imageUri || !imageLayout.displayWidth) return

    try {
      setProcessing(true)

      // Calcular las coordenadas relativas a la imagen real
      const relativeX = (cropArea.x - imageLayout.offsetX) / imageLayout.displayWidth
      const relativeY = (cropArea.y - imageLayout.offsetY) / imageLayout.displayHeight
      const relativeWidth = cropArea.width / imageLayout.displayWidth
      const relativeHeight = cropArea.height / imageLayout.displayHeight

      // Convertir a coordenadas de píxeles de la imagen original
      const cropConfig = {
        originX: Math.max(0, Math.round(relativeX * imageLayout.imageWidth)),
        originY: Math.max(0, Math.round(relativeY * imageLayout.imageHeight)),
        width: Math.min(imageLayout.imageWidth, Math.round(relativeWidth * imageLayout.imageWidth)),
        height: Math.min(imageLayout.imageHeight, Math.round(relativeHeight * imageLayout.imageHeight)),
      }

      console.log("Crop config:", cropConfig)
      console.log("Image layout:", imageLayout)
      console.log("Crop area:", cropArea)

      const croppedImage = await ImageManipulator.manipulateAsync(imageUri, [{ crop: cropConfig }], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      })

      onCropComplete(croppedImage.uri)
      onClose()
    } catch (error) {
      console.error("Error cropping image:", error)
    } finally {
      setProcessing(false)
    }
  }, [imageUri, cropArea, imageLayout, onCropComplete, onClose])

  const adjustCropArea = (adjustment: "smaller" | "larger" | "reset") => {
    if (!imageLayout.displayWidth) return

    setCropArea((prev) => {
      const minX = imageLayout.offsetX
      const maxX = imageLayout.offsetX + imageLayout.displayWidth
      const minY = imageLayout.offsetY
      const maxY = imageLayout.offsetY + imageLayout.displayHeight

      switch (adjustment) {
        case "smaller":
          const smallerWidth = Math.max(MIN_SIZE, prev.width - 20)
          const smallerHeight = Math.max(MIN_SIZE, prev.height - 20)
          return {
            x: prev.x + (prev.width - smallerWidth) / 2,
            y: prev.y + (prev.height - smallerHeight) / 2,
            width: smallerWidth,
            height: smallerHeight,
          }
        case "larger":
          const largerWidth = Math.min(maxX - minX, prev.width + 20)
          const largerHeight = Math.min(maxY - minY, prev.height + 20)
          return {
            x: Math.max(minX, prev.x - (largerWidth - prev.width) / 2),
            y: Math.max(minY, prev.y - (largerHeight - prev.height) / 2),
            width: largerWidth,
            height: largerHeight,
          }
        case "reset":
          return {
            x: Math.max(MARGIN, minX + 20),
            y: Math.max(HEADER_HEIGHT + 20, minY + 20),
            width: Math.min(imageLayout.displayWidth - 40, screenWidth - 100),
            height: Math.min(imageLayout.displayHeight - 40, 300),
          }
        default:
          return prev
      }
    })
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recortar Imagen</Text>
          <TouchableOpacity
            style={[styles.headerButton, processing && styles.disabledButton]}
            onPress={handleCrop}
            disabled={processing}
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Imagen de fondo */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.backgroundImage} resizeMode="contain" />

          {/* Overlay oscuro */}
          <View style={styles.overlay} />

          {/* Indicador del área de imagen real */}
          {imageLayout.displayWidth > 0 && (
            <View
              style={[
                styles.imageIndicator,
                {
                  left: imageLayout.offsetX,
                  top: imageLayout.offsetY,
                  width: imageLayout.displayWidth,
                  height: imageLayout.displayHeight,
                },
              ]}
            />
          )}

          {/* Área de recorte */}
          <View
            style={[
              styles.cropArea,
              {
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.cropBorder} />
            <View style={styles.centerIndicator}>
              <Ionicons name="move" size={20} color="#ff8c00" />
            </View>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Controles adicionales */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => adjustCropArea("smaller")}>
            <Ionicons name="remove" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={() => adjustCropArea("reset")}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={() => adjustCropArea("larger")}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Instrucciones */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {activeGesture ? `Ajustando: ${activeGesture}` : "Toca y arrastra para ajustar el área de recorte"}
          </Text>
        </View>

        {processing && (
          <View style={styles.processingOverlay}>
            <Text style={styles.processingText}>Procesando...</Text>
          </View>
        )}
      </View>
    </Modal>
  )
})

ImageCropModal.displayName = "ImageCropModal"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  disabledButton: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imageIndicator: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dotted",
  },
  cropArea: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  cropBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#ff8c00",
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
  centerIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 5,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#ff8c00",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 4,
  },
  topLeft: {
    top: -10,
    left: -10,
  },
  topRight: {
    top: -10,
    right: -10,
  },
  bottomLeft: {
    bottom: -10,
    left: -10,
  },
  bottomRight: {
    bottom: -10,
    right: -10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    gap: 30,
  },
  controlButton: {
    backgroundColor: "rgba(255, 140, 0, 0.8)",
    borderRadius: 25,
    padding: 12,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  instructions: {
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  instructionText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default ImageCropModal
