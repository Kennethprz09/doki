// PhotoPreviewModal.tsx
import React from "react";
import { memo, useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import BaseModal from "../common/BaseModal";
import LoadingButton from "../common/LoadingButton";
import SimpleCropper from "./SimpleCropper";

interface PhotoPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  frontPhoto: string | null;
  backPhoto: string | null;
  onRetakeFront: () => void;
  onRetakeBack: () => void;
  onSave: () => Promise<boolean>;
  onUpdateFrontPhoto: (uri: string) => void;
  onUpdateBackPhoto: (uri: string) => void;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = memo(
  ({
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
    const [saving, setSaving] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [cropTarget, setCropTarget] = useState<"front" | "back" | null>(null);

    const rotateImage = useCallback(
      async (target: "front" | "back", angle: number) => {
        const uri = target === "front" ? frontPhoto : backPhoto;
        if (!uri) return;

        try {
          console.log(`Rotating ${target} image by ${angle} degrees`);
          const result = await ImageManipulator.manipulateAsync(uri, [{ rotate: angle }], {
            compress: 0.7, // Reducimos compresión
            format: ImageManipulator.SaveFormat.JPEG,
          });

          console.log(`Rotation successful for ${target} image:`, result.uri);
          if (target === "front") {
            onUpdateFrontPhoto(result.uri);
          } else {
            onUpdateBackPhoto(result.uri);
          }
        } catch (error) {
          console.error(`Error rotating ${target} image:`, error);
          Alert.alert("Error", "No se pudo rotar la imagen");
        }
      },
      [frontPhoto, backPhoto, onUpdateFrontPhoto, onUpdateBackPhoto],
    );

    const startCrop = useCallback((target: "front" | "back") => {
      console.log(`Starting crop for ${target} photo`);
      setCropTarget(target);
      setTimeout(() => {
        console.log("Opening SimpleCropper");
        setShowCropper(true);
      }, 500); // Retraso para transición
    }, []);

    const handleCropComplete = useCallback(
      (croppedUri: string) => {
        if (!cropTarget) return;

        console.log(`Crop completed for ${cropTarget} photo:`, croppedUri);
        if (cropTarget === "front") {
          onUpdateFrontPhoto(croppedUri);
        } else {
          onUpdateBackPhoto(croppedUri);
        }

        setShowCropper(false);
        setCropTarget(null);
      },
      [cropTarget, onUpdateFrontPhoto, onUpdateBackPhoto],
    );

    const handleCropCancel = useCallback(() => {
      console.log("Crop canceled");
      setShowCropper(false);
      setCropTarget(null);
    }, []);

    const handleSave = useCallback(async () => {
      console.log("Initiating PDF save");
      setSaving(true);
      const success = await onSave();
      setSaving(false);

      if (success) {
        console.log("PDF saved successfully, closing PhotoPreviewModal");
        onClose();
      } else {
        console.log("PDF save failed");
      }
      return success;
    }, [onSave, onClose]);

    const renderPhotoSection = useCallback(
      (label: string, uri: string | null, onRetake: () => void, target: "front" | "back") => {
        if (!uri) return null;

        return (
          <View style={styles.photoSection}>
            <View style={styles.photoHeader}>
              <Text style={styles.photoLabel}>{label}</Text>
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => rotateImage(target, -90)}
                  accessibilityLabel="Rotar izquierda"
                >
                  <Ionicons name="refresh-outline" size={18} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => rotateImage(target, 90)}
                  accessibilityLabel="Rotar derecha"
                >
                  <Ionicons name="refresh-outline" size={18} color="#666" style={{ transform: [{ scaleX: -1 }] }} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.imageOverlay}>
                <TouchableOpacity style={styles.overlayButton} onPress={onRetake}>
                  <Ionicons name="camera-outline" size={20} color="#fff" />
                  <Text style={styles.overlayButtonText}>Repetir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.overlayButton} onPress={() => startCrop(target)}>
                  <Ionicons name="crop-outline" size={20} color="#fff" />
                  <Text style={styles.overlayButtonText}>Recortar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      },
      [rotateImage, startCrop],
    );

    if (showCropper && cropTarget) {
      const imageUri = cropTarget === "front" ? frontPhoto : backPhoto;
      if (!imageUri) return null;

      return (
        <SimpleCropper imageUri={imageUri} onCrop={handleCropComplete} onCancel={handleCropCancel} />
      );
    }

    return (
      <BaseModal visible={visible} onClose={onClose} animationType="fade" fullScreen={true}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.title}>Previsualización</Text>
              <View style={styles.placeholder} />
            </View>

            {renderPhotoSection("Foto Frontal", frontPhoto, onRetakeFront, "front")}
            {renderPhotoSection("Foto Trasera", backPhoto, onRetakeBack, "back")}

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <LoadingButton
                title="Guardar PDF"
                onPress={handleSave}
                loading={saving}
                disabled={!frontPhoto}
                style={styles.saveButton}
              />
            </View>
          </ScrollView>
        </View>
      </BaseModal>
    );
  },
);

PhotoPreviewModal.displayName = "PhotoPreviewModal";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  photoSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  photoActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  imageContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewImage: {
    width: "100%",
    height: 280,
    backgroundColor: "#f8f9fa",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 12,
  },
  overlayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    gap: 6,
  },
  overlayButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginHorizontal: 20,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    borderRadius: 12,
  },
});

export default PhotoPreviewModal;