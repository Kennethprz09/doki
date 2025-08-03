"use client"

import type React from "react"
import { memo } from "react"
import { TouchableOpacity, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface NewActionButtonProps {
  onPress: () => void
  disabled?: boolean
}

// Optimización 1: Botón de acción optimizado
const NewActionButton: React.FC<NewActionButtonProps> = memo(({ onPress, disabled = false }) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel="Crear nuevo documento o carpeta"
      accessibilityRole="button"
    >
      <Ionicons name="add" size={24} color="#fff" style={styles.icon} />
      <Text style={styles.text}>Nuevo</Text>
    </TouchableOpacity>
  )
})

NewActionButton.displayName = "NewActionButton"

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 100,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff8c00",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 1000,
  },
  disabled: {
    backgroundColor: "#cccccc",
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#fff",
  },
})

export default NewActionButton
