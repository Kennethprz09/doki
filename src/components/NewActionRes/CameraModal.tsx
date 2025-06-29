import React, { useRef, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";

const CameraModal: React.FC<{
  onCapture: (uri: string) => void;
  onClose: () => void;
  documentType: "frontal" | "trasero";
}> = ({ onCapture, onClose, documentType }) => {
  const cameraRef = useRef<CameraView>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });

  // Dimensiones del recuadro guía (8.5:5.5 cm)
  const DOCUMENT_RATIO = 8.5 / 5.5;
  const OVERLAY_WIDTH = screenWidth * 0.8;
  const OVERLAY_HEIGHT = OVERLAY_WIDTH / DOCUMENT_RATIO;
  const OVERLAY_LEFT = (screenWidth - OVERLAY_WIDTH) / 2;
  const OVERLAY_TOP = (screenHeight - OVERLAY_HEIGHT) / 2;

  useEffect(() => {
    (async () => {
      if (permission?.granted === false) {
        await requestPermission();
      }
      setHasPermission(permission?.granted ?? false);
    })();
  }, [permission]);

  const takePicture = async () => {
    if (
      !cameraRef.current ||
      !hasPermission ||
      cameraLayout.width === 0 ||
      cameraLayout.height === 0
    )
      return;

    try {
      // Tomar la foto
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // Obtener dimensiones reales de la imagen
      const { width: imgWidth, height: imgHeight } = await new Promise<{
        width: number;
        height: number;
      }>((resolve, reject) => {
        Image.getSize(
          photo.uri,
          (width, height) => resolve({ width, height }),
          reject
        );
      });

      // Usa las dimensiones reales del contenedor de la cámara
      const previewWidth = cameraLayout.width;
      const previewHeight = cameraLayout.height;

      // Calcular la relación de escala
      const scaleX = imgWidth / previewWidth;
      const scaleY = imgHeight / previewHeight;

      // Calcula las coordenadas del recorte con base en el overlay (estos valores oscilan según tu interfaz)
      const cropRect = {
        originX: Math.floor(OVERLAY_LEFT * scaleX),
        originY: Math.floor(OVERLAY_TOP * scaleY),
        width: Math.floor(OVERLAY_WIDTH * scaleX),
        height: Math.floor(OVERLAY_HEIGHT * scaleY),
      };

      // Ajuste de límites
      cropRect.originX = Math.max(
        0,
        Math.min(cropRect.originX, imgWidth - cropRect.width)
      );
      cropRect.originY = Math.max(
        0,
        Math.min(cropRect.originY, imgHeight - cropRect.height)
      );
      cropRect.width = Math.min(cropRect.width, imgWidth - cropRect.originX);
      cropRect.height = Math.min(cropRect.height, imgHeight - cropRect.originY);

      // Recorta la imagen usando el rectángulo calculado
      const croppedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: cropRect }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      onCapture(croppedImage.uri);
    } catch (error) {
      console.error("Error al tomar o recortar la foto:", error);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Necesitamos permiso para usar la cámara
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Conceder permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Modal animationType="slide">
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          onLayout={(e) => setCameraLayout(e.nativeEvent.layout)}
          facing="back"
        />

        {/* Recuadro guía para el documento */}
        <View
          style={[
            styles.documentFrame,
            {
              left: OVERLAY_LEFT,
              top: OVERLAY_TOP,
              width: OVERLAY_WIDTH,
              height: OVERLAY_HEIGHT,
            },
          ]}
        >
          <Text style={styles.documentText}>
            {documentType === "frontal"
              ? "Documento Frontal"
              : "Documento Trasero"}
          </Text>
        </View>

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  documentFrame: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  documentText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    padding: 10,
  },
  header: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  captureButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    padding: 20,
  },
  permissionText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#ff8c00",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    padding: 15,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
  loadingText: {
    color: "white",
    fontSize: 18,
  },
});

export default CameraModal;
