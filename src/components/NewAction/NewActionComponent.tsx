import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import CreateFolderModal from './CreateFolderModal';
import { Buffer } from 'buffer';
import { useUserStore } from './src/store/userStore';
import { useGlobalStore } from './src/store/globalStore';
import { useDocumentsStore } from './src/store/documentsStore';
import { checkInternetConnection } from './src/utils/actions';
import { Document } from '../types';
import { supabase } from './src/supabase/supabaseClient';

interface NewActionComponentProps {
  folder?: { folder?: Partial<Document> };
}

const NewActionComponent: React.FC<NewActionComponentProps> = ({ folder = {} }) => {
  const user = useUserStore((state) => state.user);
  const setLoading = useGlobalStore((state) => state.setLoading);
  const { addDocument } = useDocumentsStore();
  const [showOptions, setShowOptions] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileUpload = async () => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      Alert.alert('Sin conexión', 'Por favor, verifica tu conexión a internet.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }

    setShowOptions(false);
    setLoading(true);

    try {
      const pickedFile = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ],
        copyToCacheDirectory: true,
      });

      if (pickedFile.canceled) {
        return;
      }

      const file = pickedFile.assets[0];

      // Validar tamaño del archivo
      if (file.size && file.size > MAX_FILE_SIZE) {
        throw new Error('El archivo excede el límite de 10MB.');
      }

      // Leer archivo como Base64
      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generar ruta única
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      // Convertir Base64 a Uint8Array usando Buffer
      const fileData = Buffer.from(fileContent, 'base64');

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, fileData, {
          contentType: file.mimeType || 'application/octet-stream',
        });

      if (uploadError) {
        throw uploadError;
      }

      // Insertar metadatos en la tabla documents
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert([
          {
            name: file.name,
            size: file.size || 0,
            ext: file.mimeType || 'application/octet-stream',
            user_id: user.id,
            folder_id: folder?.folder?.id || null,
            is_folder: false,
            path: filePath,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Agregar al store
      addDocument({
        id: data.id,
        name: data.name,
        folder_id: data.folder_id,
        is_favorite: false,
        is_folder: data.is_folder,
        path: data.path,
        size: data.size,
        ext: data.ext,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch (error) {
      console.error('Error al seleccionar o enviar el archivo:', error);
      Alert.alert('Error', error.message || 'No se pudo subir el archivo.');
    } finally {
      setLoading(false);
    }
  };

  const activeDrawer = () => {
    setShowOptions(false);
    setModalVisible(true);
  };

  const onCloseFolderModal = async () => {
    setShowOptions(false);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newButton} onPress={() => setShowOptions(true)}>
        <Text style={styles.plusSign}>+</Text>
        <Text style={styles.newText}>Nuevo</Text>
      </TouchableOpacity>
      <Modal visible={showOptions} transparent onRequestClose={() => setShowOptions(false)}>
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.optionsContainer}>
              {!folder?.folder?.id && (
                <TouchableOpacity style={styles.option} onPress={activeDrawer}>
                  <View style={styles.circle}>
                    <Ionicons name="folder-outline" size={30} color="#888" />
                  </View>
                  <Text style={styles.optionText}>Carpeta</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.option} onPress={handleFileUpload}>
                <View style={styles.circle}>
                  <Ionicons name="cloud-upload-outline" size={30} color="#888" />
                </View>
                <Text style={styles.optionText}>Archivo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <CreateFolderModal isVisible={isModalVisible} onClose={onCloseFolderModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0.17,
    backgroundColor: '#fff',
  },
  newButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff8c00',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  plusSign: {
    fontSize: 24,
    fontFamily: 'Karla-Bold',
    color: '#fff',
    marginRight: 10,
  },
  newText: {
    fontSize: 16,
    fontFamily: 'Karla-Bold',
    color: '#fff',
  },
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

export default NewActionComponent;