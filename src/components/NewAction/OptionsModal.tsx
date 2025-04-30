import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateFolder: () => void;
  onUploadFile: () => void;
  onScanDocument: () => void;
  showFolderOption: boolean;
}

const OptionsModal: React.FC<OptionsModalProps> = ({
  visible,
  onClose,
  onCreateFolder,
  onUploadFile,
  onScanDocument,
  showFolderOption,
}) => (
  <Modal visible={visible} transparent onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.optionsContainer}>
          {showFolderOption && (
            <TouchableOpacity style={styles.option} onPress={onCreateFolder}>
              <View style={styles.circle}>
                <Ionicons name="folder-outline" size={30} color="#888" />
              </View>
              <Text style={styles.optionText}>Carpeta</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.option} onPress={onUploadFile}>
            <View style={styles.circle}>
              <Ionicons name="cloud-upload-outline" size={30} color="#888" />
            </View>
            <Text style={styles.optionText}>Archivo</Text>
          </TouchableOpacity>
          {!showFolderOption && (
            <TouchableOpacity style={styles.option} onPress={onScanDocument}>
              <View style={styles.circle}>
                <Ionicons name="scan-outline" size={30} color="#888" />
              </View>
              <Text style={styles.optionText}>Escanear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    borderRadius: 15,
    width: '100%',
  },
  option: {
    alignItems: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  optionText: {
    fontSize: 12,
    fontFamily: 'Karla-SemiBold',
    color: '#444',
  },
});

export default OptionsModal;