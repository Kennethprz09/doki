import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

interface PrivacyPoliciesModalProps {
  visible: boolean;
  onClose: () => void;
}

const PrivacyPoliciesModal: React.FC<PrivacyPoliciesModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Políticas de Privacidad</Text>
            <Text style={styles.modalContent}>
              Nuestra aplicación respeta tu privacidad. Recopilamos datos como tu nombre, correo electrónico y archivos subidos únicamente para proporcionar el servicio. No compartimos tu información con terceros sin tu consentimiento. Para más detalles, visita nuestro sitio web.
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Karla-Bold',
    marginBottom: 10,
  },
  modalContent: {
    fontSize: 14,
    fontFamily: 'Karla-Regular',
    marginBottom: 20,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#ff8c00',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontFamily: 'Karla-Bold',
    textAlign: 'center',
  },
});

export default PrivacyPoliciesModal;