import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, TouchableWithoutFeedback, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Document } from '../types';
import { useGlobalStore } from './src/store/globalStore';
import { useDocumentsStore } from './src/store/documentsStore';
import { checkInternetConnection } from './src/utils/actions';
import { supabase } from './src/supabase/supabaseClient';


interface ActionMoveModalProps {
  visible: boolean;
  onClose: () => void;
  selectedItems: string[];
  finishMoveModal: () => void;
  folder?: Document;
}

const ActionMoveModal: React.FC<ActionMoveModalProps> = ({ visible, onClose, selectedItems, finishMoveModal, folder = {} }) => {
  const setLoading = useGlobalStore((state) => state.setLoading);
  const { documents, updateDocument } = useDocumentsStore();

  const folders = useMemo(() => {
    let homeFolder: Document | null = null;

    if (folder?.id) {
      homeFolder = {
        id: '0',
        icon: 'file-tray-stacked-outline',
        color: '#888888',
        name: 'Inicio',
        is_folder: true,
        user_id: folder.user_id,
      };
    }

    const filteredFolders = documents?.filter((item) => item.is_folder) || [];
    return homeFolder ? [homeFolder, ...filteredFolders] : filteredFolders;
  }, [documents, folder]);

  const handleFolderSelect = async (folderSelect: Document) => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      return;
    }

    setLoading(true);

    try {
      // Determina el folder_id (null para "Inicio")
      const newFolderId = folderSelect.id === '0' ? null : folderSelect.id;

      // Actualiza los documentos en Supabase
      const { error } = await supabase
        .from('documents')
        .update({ folder_id: newFolderId })
        .in('id', selectedItems)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        throw error;
      }

      // Actualiza los documentos en el store
      selectedItems.forEach((id) => {
        updateDocument({ id, changes: { folder_id: newFolderId } });
      });

      onClose();
      finishMoveModal();
    } catch (error) {
      console.error('Error moviendo archivos:', error);
      Alert.alert('Error', 'No se pudo mover los archivos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar carpeta</Text>
            <FlatList
              style={styles.flatListStyle}
              data={folders}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.folderItem} onPress={() => handleFolderSelect(item)}>
                  <Ionicons name={item.icon || 'folder-outline'} size={30} color={item.color} style={styles.folderIcon} />
                  <Text style={styles.folderName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>No hay carpetas disponibles.</Text>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Karla-Bold',
    marginBottom: 16,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    borderRadius: 4,
    width: '100%',
  },
  folderIcon: {
    paddingHorizontal: 10,
  },
  folderName: {
    fontSize: 16,
    fontFamily: 'Karla-Regular',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Karla-Regular',
    color: '#888',
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    padding: 12,
    backgroundColor: '#ff6666',
    borderRadius: 4,
  },
  closeButtonText: {
    color: 'white',
    fontFamily: 'Karla-Bold',
  },
  flatListStyle: {
    width: '100%',
  },
});

export default ActionMoveModal;