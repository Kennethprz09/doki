import React from "react"
import { useState, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radii, shadows } from "../../theme"
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

const COLOR_PALETTE = [
  "#FF5722", "#9C27B0", "#2196F3", "#4CAF50",
  "#795548", "#FF9800", "#E91E63", "#00BCD4",
  "#8BC34A", "#9E9E9E", "#FFEB3B", "#FFC1E3",
  "#80DEEA", "#CDDC39", "#BDBDBD", "#FFE082",
  "#FFAB91", "#B3E5FC", "#A5D6A7", "#888888",
] as const

const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  onClose,
  onColorSelect,
  title = "Seleccionar color",
  selectedColor,
}) => {
  const [currentSelection, setCurrentSelection] = useState<string | null>(selectedColor || null)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirmColor = useCallback(async () => {
    if (!currentSelection) return
    try {
      setIsLoading(true)
      const success = await onColorSelect(currentSelection)
      if (success) {
        onClose()
        setCurrentSelection(null)
      }
    } catch (error) {
      console.error("Error selecting color:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentSelection, onColorSelect, onClose])

  const handleClose = useCallback(() => {
    setCurrentSelection(selectedColor || null)
    onClose()
  }, [selectedColor, onClose])

  return (
    <BaseModal visible={visible} onClose={handleClose} position="bottom">
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>

        <View style={styles.colorGrid}>
          {COLOR_PALETTE.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                currentSelection === color && styles.colorSelected,
              ]}
              onPress={() => setCurrentSelection(color)}
              accessibilityLabel={`Seleccionar color ${color}`}
            >
              {currentSelection === color && (
                <Ionicons name="checkmark" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <LoadingButton
            title="Confirmar"
            onPress={handleConfirmColor}
            loading={isLoading}
            disabled={!currentSelection}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </BaseModal>
  )
}

const styles = StyleSheet.create({
  sheet: {
    width,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.gray900,
    textAlign: "center",
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  colorSelected: {
    transform: [{ scale: 1.15 }],
    borderWidth: 3,
    borderColor: colors.white,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.gray100,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.gray600,
  },
  confirmBtn: { flex: 2, paddingVertical: 13 },
})

export default ColorPicker
