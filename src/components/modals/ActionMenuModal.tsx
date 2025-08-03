"use client";

import type React from "react";
import { memo, useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BaseModal from "../common/BaseModal";
import LoadingButton from "../common/LoadingButton";
import ColorPicker from "../common/ColorPicker";
import ActionMoveModal from "./ActionMoveModal";
import { useDocumentActions } from "../../hooks/useDocumentActions";
import { useFolderManager } from "../../hooks/useFolderManager";
import type { Document, ModalProps } from "../types";
import CreateFolderModal from "./CreateFolderModal";

interface ActionMenuModalProps extends ModalProps {
  document: Document | null;
  onActionComplete: () => void; // Callback para cuando una acción se completa y se debe cerrar el modal principal
}

// Optimización 1: Modal de menú de acciones para documentos/carpetas
const ActionMenuModal: React.FC<ActionMenuModalProps> = memo(
  ({ visible, onClose, document, onActionComplete }) => {
    const {
      toggleFavorite,
      deleteDocumentWithConfirmation,
      updateDocumentColor,
      moveDocuments,
    } = useDocumentActions();
    const { editItem, processing } = useFolderManager();

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);

    // Optimización 2: Manejar acción de favorito
    const handleToggleFavorite = useCallback(async () => {
      if (!document) return;
      const success = await toggleFavorite(document.id, document.is_favorite);
      if (success) {
        onActionComplete();
      }
    }, [document, toggleFavorite, onActionComplete]);

    // Optimización 3: Manejar acción de eliminar
    const handleDelete = useCallback(async () => {
      if (!document) return;
      const success = await deleteDocumentWithConfirmation(
        document.id,
        document.name
      );
      if (success) {
        onActionComplete();
      }
    }, [document, deleteDocumentWithConfirmation, onActionComplete]);

    // Optimización 4: Manejar acción de editar
    const handleEdit = useCallback(() => {
      setShowEditModal(true);
    }, []);

    const handleEditSubmit = useCallback(
      async (newName: string) => {
        if (!document) return false;
        const success = await editItem(document.id, newName);
        if (success) {
          onActionComplete();
        }
        return success;
      },
      [document, editItem, onActionComplete]
    );

    // Optimización 5: Manejar acción de cambiar color
    const handleChangeColor = useCallback(() => {
      setShowColorPicker(true);
    }, []);

    const handleColorSelect = useCallback(
      async (color: string) => {
        if (!document) return false;
        const success = await updateDocumentColor(document.id, color);
        if (success) {
          onActionComplete();
        }
        return success;
      },
      [document, updateDocumentColor, onActionComplete]
    );

    // Optimización 6: Manejar acción de mover
    const handleMove = useCallback(() => {
      setShowMoveModal(true);
    }, []);

    const handleMoveComplete = useCallback(() => {
      setShowMoveModal(false);
      onActionComplete();
    }, [onActionComplete]);

    if (!document) {
      return null; // No renderizar si no hay documento
    }

    return (
      <>
        <BaseModal
          visible={visible}
          onClose={onClose}
          backdropOpacity={0.6}
          position="bottom"
        >
          <View style={styles.modalContent}>
            <Text style={styles.title}>{document.name}</Text>

            {/* Opciones comunes */}
            <TouchableOpacity
              style={styles.option}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={document.is_favorite ? "star" : "star-outline"}
                size={24}
                color={document.is_favorite ? "#ff8c00" : "#666"}
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>
                {document.is_favorite
                  ? "Remover de favoritos"
                  : "Marcar como favorito"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleEdit}>
              <Ionicons
                name="create-outline"
                size={24}
                color="#666"
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>Editar nombre</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleChangeColor}>
              <Ionicons
                name="color-palette-outline"
                size={24}
                color="#666"
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>Cambiar color</Text>
            </TouchableOpacity>

            {!document.is_folder && ( // Solo para documentos, no carpetas
              <TouchableOpacity style={styles.option} onPress={handleMove}>
                <Ionicons
                  name="folder-open-outline"
                  size={24}
                  color="#666"
                  style={styles.optionIcon}
                />
                <Text style={styles.optionText}>Mover</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.option, styles.deleteOption]}
              onPress={handleDelete}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color="#dc3545"
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, styles.deleteText]}>
                Eliminar
              </Text>
            </TouchableOpacity>

            <LoadingButton
              title="Cerrar"
              onPress={onClose}
              variant="ghost"
              style={styles.closeButton}
            />
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
          folder={document.is_folder ? document : null} // Si es una carpeta, se puede mover dentro de ella
        />
      </>
    );
  }
);

ActionMenuModal.displayName = "ActionMenuModal";

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
    paddingHorizontal: 10,
  },
  option: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 8,
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
});

export default ActionMenuModal;
