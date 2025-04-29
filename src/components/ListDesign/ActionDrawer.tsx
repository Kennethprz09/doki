import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ActionColorPicker from './ActionColorPicker';
import CreateFolderModal from '../NewAction/CreateFolderModal';
import { Document } from '../types';
import { useGlobalStore } from '../../store/globalStore';
import { useDocumentsStore } from '../../store/documentsStore';
import { checkInternetConnection } from '../../utils/actions';
import { supabase } from '../../supabase/supabaseClient';

interface ActionDrawerProps {
  field: {
    visible?: boolean;
    item?: Document;
  };
}

const ActionDrawer: React.FC<ActionDrawerProps> = ({ field }) => {
  const setLoading = useGlobalStore((state) => state.setLoading);
  const { updateDocument, deleteDocument } = useDocumentsStore();
  const [showVisible, setShowVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [actionDrawerField, setActionDrawerField] = useState<{ visible?: boolean; item?: Document }>({});

  const handleClose = () => {
    setShowVisible(false);
  };

  const handleFavorite = async (id?: string, status?: number) => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      return;
    }

    if (id && status !== undefined) {
      setLoading(true);
      try {
        // Actualiza el estado de favorito en Supabase
        const { error } = await supabase
          .from('documents')
          .update({ is_favorite: status === 1 })
          .eq('id', id)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) {
          throw error;
        }

        // Actualiza el documento en el store
        updateDocument({ id, changes: { is_favorite: status === 1 } });

        handleClose();
      } catch (error) {
        console.error('Error actualizando favorito:', error);
        Alert.alert('Error', 'No se pudo actualizar el estado de favorito.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id?: string) => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      return;
    }

    if (id) {
      Alert.alert(
        'Confirmación',
        '¿Estás seguro de eliminar este registro?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, eliminar',
            onPress: async () => {
              setLoading(true);
              try {
                // Elimina el documento en Supabase
                const { error } = await supabase
                  .from('documents')
                  .delete()
                  .eq('id', id)
                  .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

                if (error) {
                  throw error;
                }

                // Elimina el documento del store
                deleteDocument(id);

                handleClose();
              } catch (error) {
                console.error('Error eliminando documento:', error);
                Alert.alert('Error', 'No se pudo eliminar el documento.');
              } finally {
                setLoading(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const activeDrawer = () => {
    setShowVisible(false);
    setModalVisible(true);
  };

  const onCloseFolderModal = () => {
    handleClose();
    setModalVisible(false);
  };

  const activeDrawerColorPicker = (item?: Document) => {
    setActionDrawerField({ visible: true, item });
  };

  const downloadFile = async (fileUrl?: string, fileName?: string) => {
    if (!fileUrl || !fileName) return;

    try {
      const downloadDir = `${FileSystem.documentDirectory}Doki_download/`;
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      const downloadDest = `${downloadDir}${fileName}`;

      // Obtener URL pública o firmada de Supabase Storage
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(fileUrl, 60);
      if (error || !data?.signedUrl) {
        throw error || new Error('No se pudo obtener la URL del archivo');
      }

      const { uri } = await FileSystem.downloadAsync(data.signedUrl, downloadDest);
      Alert.alert('Descarga completada', `Archivo guardado en: ${uri}`);
    } catch (error) {
      console.error('Error descargando el archivo:', error);
      Alert.alert('Error', 'No se pudo descargar el archivo.');
    }
  };

  const openFile = async (url?: string) => {
    if (!url) return;

    try {
      const fileName = url.split('/').pop() || 'tempfile';
      const localFile = `${FileSystem.documentDirectory}${fileName}`;

      // Obtener URL pública o firmada de Supabase Storage
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(url, 60);
      if (error || !data?.signedUrl) {
        throw error || new Error('No se pudo obtener la URL del archivo');
      }

      const { uri } = await FileSystem.downloadAsync(data.signedUrl, localFile);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'No se puede compartir el archivo.');
      }
    } catch (error) {
      console.error('Error abriendo el archivo:', error);
      Alert.alert('Error', 'No se pudo abrir el archivo.');
    }
  };

  useEffect(() => {
    setShowVisible(field.visible || false);
  }, [field]);

  return (
    <>
      <Modal visible={showVisible} transparent onRequestClose={handleClose}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.modalContainer}>
            <View style={styles.optionsContainer}>
              <View style={styles.header}>
                <Ionicons
                  name={(field.item?.icon as any) || 'document-outline'}
                  size={30}
                  color={field.item?.is_folder === true ? field.item?.color : '#888'}
                />
                <Text style={styles.headerText}>
                  {field.item?.name || 'Nombre del archivo'}
                </Text>
              </View>
              <TouchableOpacity style={styles.option} onPress={activeDrawer}>
                <Ionicons name="pencil-outline" size={24} color="#888" />
                <Text style={styles.optionText}>Cambiar nombre</Text>
              </TouchableOpacity>
              {field.item?.is_favorite ? (
                <TouchableOpacity style={styles.option} onPress={() => handleFavorite(field.item?.id, 0)}>
                  <Ionicons name="star-outline" size={24} color="#ffa500" />
                  <Text style={styles.optionText}>Quitar de favoritos</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.option} onPress={() => handleFavorite(field.item?.id, 1)}>
                  <Ionicons name="star-outline" size={24} color="#888" />
                  <Text style={styles.optionText}>Agregar a favoritos</Text>
                </TouchableOpacity>
              )}
              {field.item?.is_folder === true && (
                <TouchableOpacity style={styles.option} onPress={() => activeDrawerColorPicker(field.item)}>
                  <Ionicons name="color-palette-outline" size={24} color="#888" />
                  <Text style={styles.optionText}>Cambiar color</Text>
                </TouchableOpacity>
              )}
              {field.item?.is_folder === false && (
                <>
                  <TouchableOpacity style={styles.option} onPress={() => openFile(field.item?.path)}>
                    <Ionicons name="eye-outline" size={24} color="#888" />
                    <Text style={styles.optionText}>Ver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.option} onPress={() => downloadFile(field.item?.path, field.item?.name)}>
                    <Ionicons name="download-outline" size={24} color="#888" />
                    <Text style={styles.optionText}>Descargar</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.option} onPress={() => handleDelete(field.item?.id)}>
                <Ionicons name="trash-outline" size={24} color="#888" />
                <Text style={styles.optionText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <CreateFolderModal isVisible={isModalVisible} onClose={onCloseFolderModal} isItem={field.item} />

      <ActionColorPicker field={actionDrawerField} onClose={handleClose} />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'Karla-Bold',
    marginLeft: 8,
    color: '#333',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Karla-Regular',
    marginLeft: 16,
    color: '#444',
  },
});

export default ActionDrawer;