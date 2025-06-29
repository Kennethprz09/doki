import React, { useRef, useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onTakePicture: (photoUri: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ visible, onClose, onTakePicture }) => {
  const cameraRef = useRef<CameraView>(null);
  const [captured, setCaptured] = useState(false);
  const { width, height } = useWindowDimensions();

  const desiredRatio = { width: 4, height: 3 }; // for ratio="4:3"
  const overlayAspectRatio = 8.5 / 5.5;

  const { topOffset, leftOffset, previewWidth, previewHeight, overlayLeft, overlayTop, overlayWidth, overlayHeight } = useMemo(() => {
    const containerWidth = width;
    const containerHeight = height;
    const ratio = desiredRatio.width / desiredRatio.height;

    let topOffset, leftOffset, previewWidth, previewHeight;

    if (containerWidth / containerHeight < ratio) {
      previewWidth = containerWidth;
      previewHeight = (desiredRatio.height / desiredRatio.width) * containerWidth;
      topOffset = (containerHeight - previewHeight) / 2;
      leftOffset = 0;
    } else {
      previewHeight = containerHeight;
      previewWidth = (desiredRatio.width / desiredRatio.height) * containerHeight;
      topOffset = 0;
      leftOffset = (containerWidth - previewWidth) / 2;
    }

    let overlayWidth, overlayHeight;

    if (previewWidth / previewHeight < overlayAspectRatio) {
      overlayWidth = previewWidth;
      overlayHeight = previewWidth / overlayAspectRatio;
    } else {
      overlayHeight = previewHeight;
      overlayWidth = previewHeight * overlayAspectRatio;
    }

    const overlayLeft = leftOffset + (previewWidth - overlayWidth) / 2;
    const overlayTop = topOffset + (previewHeight - overlayHeight) / 2;

    return { topOffset, leftOffset, previewWidth, previewHeight, overlayLeft, overlayTop, overlayWidth, overlayHeight };
  }, [width, height]);

  const takePicture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'La cámara no está disponible.');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
      });

      const imageWidth = photo.width;
      const imageHeight = photo.height;

      const relativeX = (overlayLeft - leftOffset) / previewWidth;
      const relativeY = (overlayTop - topOffset) / previewHeight;
      const relativeWidth = overlayWidth / previewWidth;
      const relativeHeight = overlayHeight / previewHeight;

      let cropX = relativeX * imageWidth;
      let cropY = relativeY * imageHeight;
      let cropWidth = relativeWidth * imageWidth;
      let cropHeight = relativeHeight * imageHeight;

      cropX = Math.max(0, Math.min(cropX, imageWidth - cropWidth));
      cropY = Math.max(0, Math.min(cropY, imageHeight - cropHeight));
      cropWidth = Math.min(cropWidth, imageWidth - cropX);
      cropHeight = Math.min(cropHeight, imageHeight - cropY);

      const croppedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: cropWidth,
              height: cropHeight,
            },
          },
        ],
        { format: 'jpeg', base64: true }
      );

      setCaptured(true);
      setTimeout(() => setCaptured(false), 2000);
      onTakePicture(croppedImage.uri);
    } catch (error) {
      console.error('Error al tomar o recortar la foto:', error);
      Alert.alert('Error', 'No se pudo tomar o procesar la foto.');
    }
  };

  return (
    <Modal visible={visible} transparent={false}>
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} autoFocus={true} type="back" ref={cameraRef} ratio="4:3" />

        <View style={styles.cameraControlsHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>
        {captured && <Text style={styles.feedback}>¡Imagen capturada correctamente!</Text>}
      </View>

      <View style={styles.cameraControls}>
        <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
          <Ionicons name="camera" size={40} color="#FFF" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  cameraControlsHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraButton: {
    backgroundColor: '#ff8c00',
    borderRadius: 50,
    padding: 15,
  },
  closeButton: {
    backgroundColor: '#333',
    borderRadius: 50,
    padding: 15,
  },
  feedback: {
    position: 'absolute',
    bottom: 50,
    color: 'white',
    fontSize: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    alignSelf: 'center',
  },
});

export default CameraModal;