import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalStore } from "../../store/globalStore";
import { useDocumentsStore } from "../../store/documentsStore";
import { checkInternetConnection } from "../../utils/actions";
import { supabase } from "../../supabase/supabaseClient";
import { Document } from "../types";

const { width } = Dimensions.get("window");

interface ActionColorPickerProps {
  isVisible: boolean;
  onClose: () => void;
  isItem?: Partial<Document>;
}

const ActionColorPicker: React.FC<ActionColorPickerProps> = ({
  isVisible,
  onClose,
  isItem = {},
}) => {
  const setLoading = useGlobalStore((state) => state.setLoading);
  const updateDocument = useDocumentsStore((state) => state.updateDocument);

  const colors = [
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
  ];

  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedColor(null);
    onClose();
  };

  const handleColorSelection = async (color: string) => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      return;
    }

    if (!isItem?.id) {
      return;
    }
    handleClose();

    setLoading(true);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ color })
        .eq("id", isItem.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        throw error;
      }

      updateDocument({ id: isItem.id, changes: { color } });
    } catch (error) {
      console.error("Error al procesar el color seleccionado:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmColor = () => {
    if (selectedColor) {
      handleColorSelection(selectedColor);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Color</Text>
          <View style={styles.colorGrid}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorOption, { backgroundColor: color }]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                !selectedColor && styles.disabledButton,
              ]}
              onPress={handleConfirmColor}
              disabled={!selectedColor}
            >
              <Text style={styles.createText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Karla-Bold",
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
  },
  cancelButton: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Karla-Regular",
    color: "#000",
  },
  createButton: {
    backgroundColor: "#ff8c00",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createText: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#FFF",
  },
  disabledButton: {
    backgroundColor: "#ff8c00",
    opacity: 0.5,
  },
});

export default ActionColorPicker;
