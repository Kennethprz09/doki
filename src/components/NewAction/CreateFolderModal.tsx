import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Document } from '../types';
import { useGlobalStore } from './src/store/globalStore';
import { useUserStore } from './src/store/userStore';
import { useDocumentsStore } from './src/store/documentsStore';
import { checkInternetConnection } from './src/utils/actions';
import { supabase } from './src/supabase/supabaseClient';

const { width } = Dimensions.get('window');

interface CreateFolderModalProps {
  isVisible: boolean;
  onClose: () => void;
  isItem?: Partial<Document>;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isVisible, onClose, isItem = {} }) => {
  const setLoading = useGlobalStore((state) => state.setLoading);
  const user = useUserStore((state) => state.user);
  const { addDocument, updateDocument } = useDocumentsStore();
  const [folderName, setFolderName] = useState('');

  const handleCreate = async () => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      Alert.alert('Sin conexión', 'Por favor, verifica tu conexión a internet.');
      return;
    }

    if (!user?.id || !folderName.trim()) {
      Alert.alert('Error', 'El nombre de la carpeta es obligatorio.');
      return;
    }

    setLoading(true);
    handleClose();

    try {
      if (isItem?.id) {
        // Editar documento/carpeta existente
        const { error } = await supabase
          .from('documents')
          .update({ name: folderName.trim() })
          .eq('id', isItem.id)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        // Actualizar en el store
        updateDocument({
          id: isItem.id,
          changes: { name: folderName.trim() },
        });
      } else {
        // Crear nueva carpeta
        const { data, error } = await supabase
          .from('documents')
          .insert([
            {
              name: folderName.trim(),
              user_id: user.id,
              is_folder: true,
              icon: 'folder-outline',
            },
          ])
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Agregar al store
        addDocument({
          id: data.id,
          name: data.name,
          is_folder: true,
          is_favorite: false,
          user_id: data.user_id,
          icon: 'folder-outline',
          created_at: data.created_at,
          updated_at: data.created_at,
        });
      }
    } catch (error) {
      console.error('Error al crear/editar la carpeta:', error);
      Alert.alert('Error', 'No se pudo crear o editar la carpeta.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    onClose();
  };

  const title = isItem?.id
    ? isItem.is_folder
      ? 'Editar carpeta'
      : 'Editar archivo'
    : 'Crear carpeta';

  useEffect(() => {
    if (isItem?.name) {
      setFolderName(isItem.name);
    }
  }, [isVisible, isItem]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la carpeta"
            value={folderName}
            onChangeText={setFolderName}
            placeholderTextColor="#a3a3a3"
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, folderName.trim() ? {} : styles.disabledButton]}
              onPress={handleCreate}
              disabled={!folderName.trim()}
            >
              <Text style={styles.createText}>{isItem?.id ? 'Editar' : 'Crear'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Karla-Bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Karla-Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  cancelButton: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Karla-Regular',
    color: '#000',
  },
  createButton: {
    backgroundColor: '#ff8c00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createText: {
    fontSize: 16,
    fontFamily: 'Karla-Bold',
    color: '#FFF',
  },
  disabledButton: {
    backgroundColor: '#ff8c00',
    opacity: 0.5,
  },
});

export default CreateFolderModal;