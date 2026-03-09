"use client"

import React from "react"
import { memo, useCallback, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radii, shadows, withAlpha } from "../../theme"
import type { Document } from "../types"
import ActionMoveModal from "../modals/ActionMoveModal"

interface SelectionBarProps {
  selectedCount: number
  onClear: () => void
  selectedItems: string[]
  folder?: Document
  onActionComplete: () => void
}

const SelectionBar: React.FC<SelectionBarProps> = memo(
  ({ selectedCount, onClear, selectedItems, folder, onActionComplete }) => {
    const [moveModalVisible, setMoveModalVisible] = useState(false)

    const handleMovePress = useCallback(() => setMoveModalVisible(true), [])
    const handleMoveModalClose = useCallback(() => setMoveModalVisible(false), [])
    const handleMoveComplete = useCallback(() => {
      setMoveModalVisible(false)
      onActionComplete()
    }, [onActionComplete])

    return (
      <>
        <View style={styles.selectionBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClear} accessibilityLabel="Cancelar selección">
            <Ionicons name="close" size={18} color={colors.primary} />
          </TouchableOpacity>

          <Text style={styles.selectionText}>
            {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
          </Text>

          <TouchableOpacity
            style={styles.moveBtn}
            onPress={handleMovePress}
            accessibilityLabel="Mover documentos seleccionados"
          >
            <Ionicons name="folder-open-outline" size={16} color={colors.primary} />
            <Text style={styles.moveBtnText}>Mover</Text>
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
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.xl,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.primary, 30),
    ...shadows.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: withAlpha(colors.primary, 12),
    alignItems: "center",
    justifyContent: "center",
  },
  selectionText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    color: colors.gray700,
    fontFamily: fonts.semiBold,
  },
  moveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: withAlpha(colors.primary, 12),
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.full,
  },
  moveBtnText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
})

export default SelectionBar
