import React from "react"
import { useMemo, useCallback } from "react"
import { View, TouchableOpacity, FlatList, StyleSheet, Dimensions, Text } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts, radii, shadows, withAlpha } from "../../theme"
import BaseModal from "../common/BaseModal"
import { useDocumentsStore } from "../../store/documentsStore"
import { useDocumentActions } from "../../hooks/useDocumentActions"
import type { Document, ModalProps } from "../types"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

interface ActionMoveModalProps extends ModalProps {
  selectedItems: string[]
  onMoveComplete: () => void
  folder?: Document
}

const ActionMoveModal: React.FC<ActionMoveModalProps> = ({
  visible,
  onClose,
  selectedItems,
  onMoveComplete,
  folder,
}) => {
  const { documents } = useDocumentsStore()
  const { moveDocuments } = useDocumentActions()
  const insets = useSafeAreaInsets()

  const availableFolders = useMemo(() => {
    const folders: Document[] = []
    if (folder?.id) {
      folders.push({
        id: "home",
        name: "Inicio",
        icon: "home-outline",
        color: colors.primary,
        is_folder: true,
        is_favorite: false,
        user_id: folder.user_id,
        created_at: "",
        updated_at: "",
      })
    }
    folders.push(...documents.filter((doc) => doc.is_folder))
    return folders
  }, [documents, folder])

  const handleFolderSelect = useCallback(
    async (targetFolder: Document) => {
      const targetFolderId = targetFolder.id === "home" ? null : targetFolder.id
      const success = await moveDocuments(selectedItems, targetFolderId)
      if (success) onMoveComplete()
    },
    [selectedItems, moveDocuments, onMoveComplete],
  )

  const renderFolderItem = useCallback(
    ({ item }: { item: Document }) => (
      <TouchableOpacity
        style={styles.folderItem}
        onPress={() => handleFolderSelect(item)}
        accessibilityLabel={`Mover a ${item.name}`}
      >
        <View style={[styles.folderIconWrap, { backgroundColor: withAlpha(item.color || colors.gray400, 15) }]}>
          <Ionicons
            name={(item.icon as any) || "folder-outline"}
            size={22}
            color={item.color || colors.gray500}
          />
        </View>
        <Text style={styles.folderName}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
      </TouchableOpacity>
    ),
    [handleFolderSelect],
  )

  const EmptyComponent = useCallback(
    () => (
      <View style={styles.empty}>
        <Ionicons name="folder-open-outline" size={48} color={colors.gray300} />
        <Text style={styles.emptyText}>No hay carpetas disponibles</Text>
      </View>
    ),
    [],
  )

  const keyExtractor = useCallback((item: Document) => item.id, [])

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} accessibilityLabel="Cerrar">
            <Ionicons name="arrow-back" size={20} color={colors.gray700} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Mover a</Text>
            <Text style={styles.headerSub}>
              {selectedItems.length} elemento{selectedItems.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <FlatList
          data={availableFolders}
          keyExtractor={keyExtractor}
          renderItem={renderFolderItem}
          ListEmptyComponent={EmptyComponent}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </BaseModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
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
  headerSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.gray500,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  folderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    ...shadows.sm,
  },
  folderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  folderName: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.gray800,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.gray400,
  },
})

export default ActionMoveModal
