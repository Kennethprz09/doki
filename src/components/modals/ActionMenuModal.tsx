"use client"

import type React from "react"
import { memo, useCallback, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import BaseModal from "../common/BaseModal"
import LoadingButton from "../common/LoadingButton"
import ColorPicker from "../common/ColorPicker"
import ActionMoveModal from "./ActionMoveModal"
import CreateFolderModal from "./CreateFolderModal"
import { useDocumentActions } from "../../hooks/useDocumentActions"
import { useFolderManager } from "../../hooks/useFolderManager"
import { useFileOperations } from "../../hooks/useFileOperations"
import type { Document, ModalProps } from "../types"
// Agregar el import del nuevo hook:
import { useImageViewer } from "../../hooks/useImageViewer"

interface ActionMenuModalProps extends ModalProps {
  document: Document | null
  onActionComplete: () => void
  folder?: Document
}

const ActionMenuModal: React.FC<ActionMenuModalProps> = memo(
  ({ visible, onClose, document, onActionComplete, folder }) => {
    const { toggleFavorite, deleteDocumentWithConfirmation, updateDocumentColor, moveDocuments } = useDocumentActions()

    const { editItem, processing } = useFolderManager()
    const { viewFile, shareFile, downloadFile } = useFileOperations()
    // Dentro del componente, agregar el hook:
    const { viewImage } = useImageViewer()

    const [showColorPicker, setShowColorPicker] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showMoveModal, setShowMoveModal] = useState(false)

    // Handlers optimizados
    const handleToggleFavorite = useCallback(async () => {
      if (!document) return
      const success = await toggleFavorite(document.id, document.is_favorite)
      if (success) {
        onActionComplete()
      }
    }, [document, toggleFavorite, onActionComplete])

    // Función auxiliar para detectar si es imagen:
    const isImageFile = useCallback((ext?: string) => {
      if (!ext) return false
      const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"]
      return imageExtensions.includes(ext.toLowerCase().replace(".", ""))
    }, [])

    // Reemplazar handleViewFile:
    const handleViewFile = useCallback(async () => {
      if (!document) return
      onClose() // Cerrar modal antes de la operación

      // Si es imagen, usar el visor específico
      if (isImageFile(document.ext)) {
        await viewImage(document.path, document.name)
      } else {
        await viewFile(document.path, document.ext, document.name)
      }
    }, [document, viewFile, viewImage, isImageFile, onClose])

    const handleShareFile = useCallback(async () => {
      if (!document) return
      onClose() // Cerrar modal antes de la operación
      await shareFile(document.path, document.name)
    }, [document, shareFile, onClose])

    const handleDownloadFile = useCallback(async () => {
      if (!document) return
      onClose() // Cerrar modal antes de la operación
      await downloadFile(document.path, document.name, document.ext)
    }, [document, downloadFile, onClose])

    const handleDelete = useCallback(async () => {
      if (!document) return
      const success = await deleteDocumentWithConfirmation(document.id, document.name)
      if (success) {
        onActionComplete()
      }
    }, [document, deleteDocumentWithConfirmation, onActionComplete])

    const handleEdit = useCallback(() => {
      setShowEditModal(true)
    }, [])

    const handleEditSubmit = useCallback(
      async (newName: string) => {
        if (!document) return false
        const success = await editItem(document.id, newName)
        if (success) {
          onActionComplete()
        }
        return success
      },
      [document, editItem, onActionComplete],
    )

    const handleChangeColor = useCallback(() => {
      setShowColorPicker(true)
    }, [])

    const handleColorSelect = useCallback(
      async (color: string) => {
        if (!document) return false
        const success = await updateDocumentColor(document.id, color)
        if (success) {
          onActionComplete()
        }
        return success
      },
      [document, updateDocumentColor, onActionComplete],
    )

    const handleMove = useCallback(() => {
      setShowMoveModal(true)
    }, [])

    const handleMoveComplete = useCallback(() => {
      setShowMoveModal(false)
      onActionComplete()
    }, [onActionComplete])

    if (!document) {
      return null
    }

    // Configuración de opciones del menú
    const menuOptions = [
      {
        key: "favorite",
        icon: document.is_favorite ? "star" : "star-outline",
        iconColor: document.is_favorite ? "#ff8c00" : "#666",
        text: document.is_favorite ? "Remover de favoritos" : "Marcar como favorito",
        onPress: handleToggleFavorite,
        show: true,
      },
      {
        key: "view",
        icon: "eye-outline",
        iconColor: "#666",
        text: "Ver",
        onPress: handleViewFile,
        show: !document.is_folder,
      },
      {
        key: "share",
        icon: "share-social-outline",
        iconColor: "#666",
        text: "Compartir",
        onPress: handleShareFile,
        show: !document.is_folder,
      },
      {
        key: "download",
        icon: "download-outline",
        iconColor: "#666",
        text: "Descargar",
        onPress: handleDownloadFile,
        show: !document.is_folder,
      },
      {
        key: "edit",
        icon: "create-outline",
        iconColor: "#666",
        text: "Editar nombre",
        onPress: handleEdit,
        show: true,
      },
      {
        key: "color",
        icon: "color-palette-outline",
        iconColor: "#666",
        text: "Cambiar color",
        onPress: handleChangeColor,
        show: true,
      },
      {
        key: "move",
        icon: "folder-open-outline",
        iconColor: "#666",
        text: "Mover",
        onPress: handleMove,
        show: !document.is_folder,
      },
      {
        key: "delete",
        icon: "trash-outline",
        iconColor: "#dc3545",
        text: "Eliminar",
        onPress: handleDelete,
        show: true,
        isDestructive: true,
      },
    ]

    return (
      <>
        <BaseModal visible={visible} onClose={onClose} backdropOpacity={0.6} position="bottom">
          <View style={styles.modalContent}>
            <Text style={styles.title} numberOfLines={2}>
              {document.name}
            </Text>

            {menuOptions
              .filter((option) => option.show)
              .map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.option, option.isDestructive && styles.deleteOption]}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name={option.icon as any} size={24} color={option.iconColor} style={styles.optionIcon} />
                  <Text style={[styles.optionText, option.isDestructive && styles.deleteText]}>{option.text}</Text>
                </TouchableOpacity>
              ))}

            <LoadingButton title="Cerrar" onPress={onClose} variant="ghost" style={styles.closeButton} />
          </View>
        </BaseModal>

        {/* Modales anidados */}
        <ColorPicker
          visible={showColorPicker}
          onClose={() => setShowColorPicker(false)}
          onColorSelect={handleColorSelect}
          selectedColor={document.color || undefined}
        />

        <CreateFolderModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          editItem={document}
          loading={processing}
        />

        <ActionMoveModal
          visible={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          selectedItems={document ? [document.id] : []}
          onMoveComplete={handleMoveComplete}
          folder={folder}
        />
      </>
    )
  },
)

ActionMenuModal.displayName = "ActionMenuModal"

const styles = StyleSheet.create({
  modalContent: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: "Karla-Bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  option: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: "#f8f9fa",
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
    color: "#333",
  },
  deleteOption: {
    backgroundColor: "#ffebeb",
  },
  deleteText: {
    color: "#dc3545",
  },
  closeButton: {
    marginTop: 10,
    marginHorizontal: 10,
  },
})

export default ActionMenuModal
