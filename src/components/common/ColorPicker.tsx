"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import BaseModal from "./BaseModal"
import LoadingButton from "./LoadingButton"

const { width } = Dimensions.get("window")

interface ColorPickerProps {
  visible: boolean
  onClose: () => void
  onColorSelect: (color: string) => Promise<boolean>
  title?: string
  selectedColor?: string
}

// Optimización 1: Paleta de colores como constante
const COLOR_PALETTE = [
  "#FF5722",
  "#9C27B0",
  "#2196F3",
  "#4CAF50",
  "#795548",
  "#FF9800",
  "#E91E63",
  "#00BCD4",
  "#8BC34A",
  "#9E9E9E",
  "#FFEB3B",
  "#FFC1E3",
  "#80DEEA",
  "#CDDC39",
  "#BDBDBD",
  "#FFE082",
  "#FFAB91",
  "#B3E5FC",
  "#A5D6A7",
  "#888888",
] as const

// Optimización 2: Componente de color picker reutilizable
const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  onClose,
  onColorSelect,
  title = "Seleccionar Color",
  selectedColor,
}) => {
  const [currentSelection, setCurrentSelection] = useState<string | null>(selectedColor || null)
  const [isLoading, setIsLoading] = useState(false)

  // Optimización 3: Función para confirmar selección
  const handleConfirmColor = useCallback(async () => {
    if (!currentSelection) return

    setIsLoading(true)
    const success = await onColorSelect(currentSelection)
    setIsLoading(false)

    if (success) {
      onClose()
      setCurrentSelection(null)
    }
  }, [currentSelection, onColorSelect, onClose])

  // Optimización 4: Función para cerrar modal
  const handleClose = useCallback(() => {
    setCurrentSelection(selectedColor || null)
    onClose()
  }, [selectedColor, onClose])

  return (
    <BaseModal visible={visible} onClose={handleClose}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>

        <View style={styles.colorGrid}>
          {COLOR_PALETTE.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorOption, { backgroundColor: color }]}
              onPress={() => setCurrentSelection(color)}
              accessibilityLabel={`Seleccionar color ${color}`}
            >
              {currentSelection === color && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>

          <LoadingButton
            title="Confirmar"
            onPress={handleConfirmColor}
            loading={isLoading}
            disabled={!currentSelection}
            style={styles.confirmButton}
          />
        </View>
      </View>
    </BaseModal>
  )
}

const styles = StyleSheet.create({
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Karla-Bold",
    textAlign: "center",
    marginBottom: 24,
    color: "#333",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 24,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    margin: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
    marginLeft: 16,
  },
})

export default ColorPicker
