"use client"

import type React from "react"
import { memo, useCallback, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Document } from "../types"
import ActionMoveModal from "../modals/ActionMoveModal"

interface SelectionBarProps {
  selectedCount: number
  onClear: () => void
  selectedItems: string[]
  folder?: Document
  onActionComplete: () => void
}

// Optimización 1: Barra de selección optimizada
const SelectionBar: React.FC<SelectionBarProps> = memo(
  ({ selectedCount, onClear, selectedItems, folder, onActionComplete }) => {
    const [moveModalVisible, setMoveModalVisible] = useState(false)

    // Optimización 2: Función para mostrar modal de mover
    const handleMovePress = useCallback(() => {
      setMoveModalVisible(true)
    }, [])

    // Optimización 3: Función para cerrar modal de mover
    const handleMoveModalClose = useCallback(() => {
      setMoveModalVisible(false)
    }, [])

    // Optimización 4: Función para completar movimiento
    const handleMoveComplete = useCallback(() => {
      setMoveModalVisible(false)
      onActionComplete()
    }, [onActionComplete])

    return (
      <>
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={onClear} accessibilityLabel="Cancelar selección">
            <Ionicons name="close" size={24} color="#ff8c00" />
          </TouchableOpacity>

          <Text style={styles.selectionText}>
            {selectedCount} elemento{selectedCount !== 1 ? "s" : ""} seleccionado{selectedCount !== 1 ? "s" : ""}
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMovePress}
            accessibilityLabel="Mover documentos seleccionados"
          >
            <Text style={styles.actionText}>Mover</Text>
            <Ionicons name="folder-open-outline" size={24} color="#ff8c00" />
          </TouchableOpacity>
        </View>

        <ActionMoveModal
          visible={moveModalVisible}
          onClose={handleMoveModalClose}
          selectedItems={selectedItems}
          onMoveComplete={handleMoveComplete}
          folder={folder}
        />
      </>
    )
  },
)

SelectionBar.displayName = "SelectionBar"

const styles = StyleSheet.create({
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: "#ff8c00",
    fontFamily: "Karla-Bold",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
    color: "#ff8c00",
    marginRight: 8,
  },
})

export default SelectionBar
