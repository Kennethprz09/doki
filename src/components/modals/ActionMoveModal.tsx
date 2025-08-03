"use client"

import React from "react"
import { useMemo, useCallback } from "react"
import { View, TouchableOpacity, FlatList, StyleSheet, Dimensions, Text } from "react-native" // Import Dimensions
import { Ionicons } from "@expo/vector-icons"
import BaseModal from "../common/BaseModal"
import LoadingButton from "../common/LoadingButton"
import { useDocumentsStore } from "../../store/documentsStore"
import { useDocumentActions } from "../../hooks/useDocumentActions"
import type { Document, ModalProps } from "../types"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window") // Get screen dimensions

interface ActionMoveModalProps extends ModalProps {
  selectedItems: string[]
  onMoveComplete: () => void
  folder?: Document
}

// Optimización 1: Modal de mover documentos optimizado
const ActionMoveModal: React.FC<ActionMoveModalProps> = ({
  visible,
  onClose,
  selectedItems,
  onMoveComplete,
  folder,
}) => {
  const { documents } = useDocumentsStore()
  const { moveDocuments } = useDocumentActions()

  // Optimización 2: Memoizar carpetas disponibles
  const availableFolders = useMemo(() => {
    const folders: Document[] = []

    // Agregar opción "Inicio" si estamos en una carpeta
    if (folder?.id) {
      folders.push({
        id: "home",
        name: "Inicio",
        icon: "file-tray-stacked-outline",
        color: "#888888",
        is_folder: true,
        is_favorite: false,
        user_id: folder.user_id,
        created_at: "",
        updated_at: "",
      })
    }

    // Agregar carpetas existentes
    const existingFolders = documents.filter((doc) => doc.is_folder) || []
    folders.push(...existingFolders)

    return folders
  }, [documents, folder])

  // Optimización 3: Función para seleccionar carpeta
  const handleFolderSelect = useCallback(
    async (targetFolder: Document) => {
      const targetFolderId = targetFolder.id === "home" ? null : targetFolder.id
      const success = await moveDocuments(selectedItems, targetFolderId)

      if (success) {
        onMoveComplete()
      }
    },
    [selectedItems, moveDocuments, onMoveComplete],
  )

  // Optimización 4: Render item optimizado
  const renderFolderItem = useCallback(
    ({ item }: { item: Document }) => (
      <TouchableOpacity
        style={styles.folderItem}
        onPress={() => handleFolderSelect(item)}
        accessibilityLabel={`Mover a ${item.name}`}
      >
        <Ionicons
          name={(item.icon as any) || "folder-outline"}
          size={28}
          color={item.color || "#888"}
          style={styles.folderIcon}
        />
        <Text style={styles.folderName}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    ),
    [handleFolderSelect],
  )

  // Optimización 5: Key extractor
  const keyExtractor = useCallback((item: Document) => item.id, [])

  // Optimización 6: Empty component
  const EmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No hay carpetas disponibles</Text>
      </View>
    ),
    [],
  )

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen={true}>
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <Ionicons name="folder-open-outline" size={24} color="#ff8c00" />
          <Text style={styles.modalTitle}>Seleccionar destino</Text>
        </View>

        <Text style={styles.subtitle}>
          Mover {selectedItems.length} elemento{selectedItems.length !== 1 ? "s" : ""} a:
        </Text>

        <FlatList
          data={availableFolders}
          keyExtractor={keyExtractor}
          renderItem={renderFolderItem}
          ListEmptyComponent={EmptyComponent}
          style={styles.folderList}
          showsVerticalScrollIndicator={false}
        />

        <LoadingButton title="Cancelar" onPress={onClose} variant="ghost" style={styles.cancelButton} />
      </View>
    </BaseModal>
  )
}

const styles = StyleSheet.create({
  modalContent: {
    width: screenWidth, // ⭐ Ocupar todo el ancho de la pantalla
    height: screenHeight, // ⭐ Ocupar toda la altura de la pantalla
    maxWidth: screenWidth, // ⭐ Anular maxWidth
    maxHeight: screenHeight, // ⭐ Anular maxHeight
    backgroundColor: "white",
    borderRadius: 0, // ⭐ Quitar borderRadius para fullscreen
    padding: 20,
    justifyContent: "space-between", // ⭐ Ajustar para distribuir contenido
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingTop: 30, // Ajustar padding para statusBar
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Karla-Bold",
    color: "#333",
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Karla-Regular",
    color: "#666",
    marginBottom: 16,
  },
  folderList: {
    flex: 1, // ⭐ Permitir que la lista crezca
    marginBottom: 16,
  },
  folderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  folderIcon: {
    marginRight: 12,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
    color: "#333",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Karla-Regular",
    color: "#888",
    marginTop: 12,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 8,
  },
})

export default ActionMoveModal
