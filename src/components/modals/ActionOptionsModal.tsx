"use client"

import type React from "react"
import { memo, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import BaseModal from "../common/BaseModal"

interface ActionOption {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
}

interface ActionOptionsModalProps {
  visible: boolean
  onClose: () => void
  options: ActionOption[]
}

// Optimización 1: Modal de opciones reutilizable
const ActionOptionsModal: React.FC<ActionOptionsModalProps> = memo(({ visible, onClose, options }) => {
  // Optimización 2: Render de opción individual
  const renderOption = useCallback(
    (option: ActionOption) => (
      <TouchableOpacity
        key={option.id}
        style={styles.option}
        onPress={() => {
          option.onPress()
          onClose()
        }}
        accessibilityLabel={option.label}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={option.icon} size={30} color="#666" />
        </View>
        <Text style={styles.optionText}>{option.label}</Text>
      </TouchableOpacity>
    ),
    [onClose],
  )

  return (
    <BaseModal visible={visible} onClose={onClose} backdropOpacity={0.5} position="bottom">
      <View style={styles.container}>
        <View style={styles.optionsContainer}>{options.map(renderOption)}</View>
      </View>
    </BaseModal>
  )
})

ActionOptionsModal.displayName = "ActionOptionsModal"

const styles = StyleSheet.create({
  container: {
    width: "100%", // Asegurar que el contenedor interno también ocupe el 100%
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  optionsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 20,
  },
  option: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Karla-SemiBold",
    color: "#333",
    textAlign: "center",
  },
})

export default ActionOptionsModal
