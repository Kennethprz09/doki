import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

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
}) => (
  <Modal visible={visible} transparent onRequestClose={onClose}>
    <View style={styles.previewContainer}>
      <Text style={styles.previewTitle}>Previsualización del Documento</Text>
      {frontPhoto && (
        <View style={styles.previewImageContainer}>
          <Text style={styles.imageLabel}>Foto Frontal</Text>
          <Image source={{ uri: frontPhoto }} style={styles.previewImage} />
          <TouchableOpacity style={styles.retakeButton} onPress={onRetakeFront}>
            <Text style={styles.retakeText}>Repetir</Text>
          </TouchableOpacity>
        </View>
      )}
      {backPhoto && (
        <View style={styles.previewImageContainer}>
          <Text style={styles.imageLabel}>Foto Trasera</Text>
          <Image source={{ uri: backPhoto }} style={styles.previewImage} />
          <TouchableOpacity style={styles.retakeButton} onPress={onRetakeBack}>
            <Text style={styles.retakeText}>Repetir</Text>
          </TouchableOpacity>
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
    </View>
  </Modal>
);

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
    transform: [{ rotate: '90deg' }],
    borderRadius: 2,
  },
  retakeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ff4444',
    borderRadius: 5,
  },
  retakeText: {
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