import React, { useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import SimpleCropper from './SimpleCropper';
import * as ImageManipulator from 'expo-image-manipulator';

const { width } = Dimensions.get('window');

interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  frontPhoto: string | null;
  backPhoto: string | null;
  onRetakeFront: () => void;
  onRetakeBack: () => void;
  onSave: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  onClose,
  frontPhoto,
  backPhoto,
  onRetakeFront,
  onRetakeBack,
  onSave,
}) => {
  const [showCropper, setShowCropper] = useState(false);
  const [cropTarget, setCropTarget] = useState<'front' | 'back' | null>(null);
  const [front, setFront] = useState(frontPhoto);
  const [back, setBack] = useState(backPhoto);

  // Actualiza las fotos si cambian las props
  React.useEffect(() => {
    setFront(frontPhoto);
    setBack(backPhoto);
  }, [frontPhoto, backPhoto]);

  // Función para rotar la imagen
  const rotateImage = async (target: 'front' | 'back', angle: number) => {
    const uri = target === 'front' ? front : back;
    if (!uri) return;
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ rotate: angle }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    if (target === 'front') setFront(result.uri);
    else setBack(result.uri);
  };

  // Función para manejar el recorte
  const handleCrop = async (cropRect: { originX: number; originY: number; width: number; height: number }) => {
    const uri = cropTarget === 'front' ? front : back;
    if (!uri) return;
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: cropRect }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    if (cropTarget === 'front') setFront(result.uri);
    else setBack(result.uri);
    setShowCropper(false);
    setCropTarget(null);
  };

  return (
    <Modal visible={visible} transparent onRequestClose={onClose}>
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Previsualización del Documento</Text>
        {showCropper && cropTarget && (
          <SimpleCropper
            imageUri={cropTarget === 'front' ? front! : back!}
            onCrop={handleCrop}
          />
        )}
        {!showCropper && (
          <>
            {front && (
              <View style={styles.previewImageContainer}>
                <Text style={styles.imageLabel}>Foto Frontal</Text>
                <Image source={{ uri: front }} style={styles.previewImage} />
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.retakeButton} onPress={onRetakeFront}>
                    <Text style={styles.retakeText}>Repetir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cropButton}
                    onPress={() => {
                      setShowCropper(true);
                      setCropTarget('front');
                    }}
                  >
                    <Text style={styles.cropText}>Recortar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rotateButton}
                    onPress={() => rotateImage('front', -90)}
                  >
                    <Text style={styles.rotateText}>Rotar Izq</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rotateButton}
                    onPress={() => rotateImage('front', 90)}
                  >
                    <Text style={styles.rotateText}>Rotar Der</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {back && (
              <View style={styles.previewImageContainer}>
                <Text style={styles.imageLabel}>Foto Trasera</Text>
                <Image source={{ uri: back }} style={styles.previewImage} />
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.retakeButton} onPress={onRetakeBack}>
                    <Text style={styles.retakeText}>Repetir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cropButton}
                    onPress={() => {
                      setShowCropper(true);
                      setCropTarget('back');
                    }}
                  >
                    <Text style={styles.cropText}>Recortar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rotateButton}
                    onPress={() => rotateImage('back', -90)}
                  >
                    <Text style={styles.rotateText}>Rotar Izq</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rotateButton}
                    onPress={() => rotateImage('back', 90)}
                  >
                    <Text style={styles.rotateText}>Rotar Der</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <View style={styles.previewButtons}>
              <TouchableOpacity style={[styles.previewButton, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.previewButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.previewButton, styles.saveButton]} onPress={onSave}>
                <Text style={styles.previewButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontFamily: 'Karla-Bold',
    marginBottom: 20,
  },
  previewImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 16,
    fontFamily: 'Karla-SemiBold',
    marginBottom: 10,
  },
  previewImage: {
    width: 220,
    height: 250,
    borderRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  retakeButton: {
    padding: 10,
    backgroundColor: '#ff4444',
    borderRadius: 5,
  },
  retakeText: {
    color: '#fff',
    fontFamily: 'Karla-SemiBold',
  },
  cropButton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  cropText: {
    color: '#fff',
    fontFamily: 'Karla-SemiBold',
  },
  rotateButton: {
    padding: 10,
    backgroundColor: '#28a745',
    borderRadius: 5,
  },
  rotateText: {
    color: '#fff',
    fontFamily: 'Karla-SemiBold',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  previewButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#ff8c00',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Karla-Bold',
  },
});

export default PreviewModal;
