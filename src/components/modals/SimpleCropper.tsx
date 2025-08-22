// src/components/modals/SimpleCropper.tsx
import React from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { ImageEditor } from "expo-crop-image";

interface SimpleCropperProps {
  imageUri: string;
  onCrop: (imageUri: string) => void;
  onCancel: () => void;
}

export default function SimpleCropper({
  imageUri,
  onCrop,
  onCancel,
}: SimpleCropperProps) {
  try {
    return (
      <ImageEditor
        isVisible={true}
        imageUri={imageUri}
        fixedAspectRatio={1}
        minimumCropDimensions={{ width: 0, height: 0 }}
        onEditingCancel={() => {
          console.log("Canceling crop in ImageEditor");
          onCancel();
        }}
        onEditingComplete={(image) => {
          console.log("Crop completed in ImageEditor, image:", image);
          if (image && image.uri) {
            onCrop(image.uri);
          } else {
            console.error("No valid image URI after crop");
            Alert.alert("Error", "No se pudo completar el recorte");
            onCancel();
          }
        }}
        editorOptions={{
          controlBar: {
            position: "bottom",
            cancelButton: {
              text: "Cancelar",
              color: "#fff",
              iconName: "close",
            },
            cropButton: {
              text: "Recortar",
              color: "#fff",
              iconName: "check",
            },
            backButton: {
              text: "Volver",
              color: "#fff",
              iconName: "chevron-left",
            },
            saveButton: {
              text: "Guardar",
              color: "#fff",
              iconName: "save",
            },
          },
        }}
      />
    );
  } catch (error) {
    console.error("Error rendering ImageEditor:", error);
    Alert.alert("Error", "No se pudo abrir el editor de recorte");
    onCancel();
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No se pudo cargar el editor de recorte. Por favor, intenta de nuevo.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 16,
    color: "#ff0000",
    textAlign: "center",
    padding: 20,
  },
});