// src/components/modals/SimpleCropper.tsx
import React, { useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { ImageEditor } from "expo-dynamic-image-crop";

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
      <View style={{ flex: 1 }}>
        <ImageEditor
          isVisible={true}
          dynamicCrop={true}
          imageUri={imageUri}
          minimumCropDimensions={{ width: 50, height: 50 }}
          onEditingCancel={() => {
            onCancel();
          }}
          onEditingComplete={(image) => {
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
      </View>
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
