import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SimpleCropper from "./SimpleCropper";
import * as ImageManipulator from "expo-image-manipulator";

const { width } = Dimensions.get("window");

interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  frontPhoto: string | null;
  backPhoto: string | null;
  onRetakeFront: () => void;
  onRetakeBack: () => void;
  onSave: () => void;
  onUpdateFrontPhoto: (uri: string) => void;
  onUpdateBackPhoto: (uri: string) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  onClose,
  frontPhoto,
  backPhoto,
  onRetakeFront,
  onRetakeBack,
  onSave,
  onUpdateFrontPhoto,
  onUpdateBackPhoto,
}) => {
  const [showCropper, setShowCropper] = useState(false);
  const [cropTarget, setCropTarget] = useState<"front" | "back" | null>(null);
  const [front, setFront] = useState<string | null>(frontPhoto);
  const [back, setBack] = useState<string | null>(backPhoto);

  useEffect(() => {
    setFront(frontPhoto);
    setBack(backPhoto);
  }, [frontPhoto, backPhoto]);

  const rotateImage = async (target: "front" | "back", angle: number) => {
    const uri = target === "front" ? front : back;
    if (!uri) return;
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ rotate: angle }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    target === "front" ? setFront(result.uri) : setBack(result.uri);
  };

const handleCrop = (croppedUri: string) => {
  if (cropTarget === "front") {
    setFront(croppedUri);
    onUpdateFrontPhoto(croppedUri);
  } else if (cropTarget === "back") {
    setBack(croppedUri);
    onUpdateBackPhoto(croppedUri);
  }
  setShowCropper(false);
  setCropTarget(null);
};

  const handleCancelCrop = () => {
    setShowCropper(false);
    setCropTarget(null);
  };

  const renderPhotoSection = (
    label: string,
    uri: string | null,
    onRetake: () => void,
    key: "front" | "back"
  ) => {
    if (!uri) return null;
    return (
      <View style={styles.photoSection}>
        <Text style={styles.imageLabel}>{label}</Text>
        <Image source={{ uri }} style={styles.previewImage} />

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.retakeBtn} onPress={onRetake}>
            <Text style={styles.retakeText}>Repetir</Text>
          </TouchableOpacity>

          <View style={styles.iconGroup}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                setCropTarget(key);
                setShowCropper(true);
              }}
            >
              <Ionicons name="crop-outline" size={24} color="#007bff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => rotateImage(key, -90)}
            >
              <Ionicons name="arrow-undo-sharp" size={24} color="#28a745" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => rotateImage(key, 90)}
            >
              <Ionicons name="arrow-redo-sharp" size={24} color="#28a745" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.fullContainer}>
        <Text style={styles.title}>Previsualización del Documento</Text>

        {showCropper && cropTarget ? (
          <SimpleCropper
            imageUri={cropTarget === "front" ? front! : back!}
            onCrop={handleCrop}
            onCancel={handleCancelCrop}
          />
        ) : (
          <>
            {renderPhotoSection("Foto Frontal", front, onRetakeFront, "front")}
            {renderPhotoSection("Foto Trasera", back, onRetakeBack, "back")}

            <View style={styles.footerBtns}>
              <TouchableOpacity
                style={[styles.footerBtn, styles.cancelBtn]}
                onPress={onClose}
              >
                <Text style={styles.footerText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBtn, styles.saveBtn]}
                onPress={onSave}
              >
                <Text style={styles.footerText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  photoSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  previewImage: {
    width: "100%",
    height: 300,
    borderRadius: 4,
    backgroundColor: "#eee",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    width: "100%",
    justifyContent: "space-between",
  },
  retakeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ff4444",
    borderRadius: 4,
  },
  retakeText: {
    color: "#fff",
    fontWeight: "600",
  },
  iconGroup: {
    flexDirection: "row",
  },
  iconBtn: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  footerBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelBtn: { backgroundColor: "#ccc" },
  saveBtn: { backgroundColor: "#ff8c00" },
  footerText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default PreviewModal;

