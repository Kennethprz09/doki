import React, { useState } from 'react';
import { Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import ActionDrawer from './ActionDrawer';
import ActionMoveModal from './ActionMoveModal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Document, RootStackParamList } from '../types';
import { listDocuments } from '../../utils/actions';

interface FileItemProps {
  item: Document;
  activeDrawer: (item: Document) => void;
  onLongPress: (item: Document) => void;
  onPress: (item: Document) => void;
  isSelected: boolean;
  showMoreButton: boolean;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const FileItem: React.FC<FileItemProps> = ({ item, activeDrawer, onLongPress, onPress, isSelected, showMoreButton, navigation }) => (
  <TouchableOpacity
    onPress={() => {
      if (item.is_folder === true) {
        if (showMoreButton) {
          navigation.navigate('OpenFolderPage', { item });
        }
      } else {        
        onPress(item);
      }
    }}
    onLongPress={() => {
      if (item.is_folder !== true) {
        onLongPress(item);
      }
    }}
    style={[styles.fileItem, isSelected && styles.selectedItem]}
  >
    <Ionicons
      name={isSelected ? 'checkmark-circle-outline' : (item.icon as any) || 'document-outline'}
      size={30}
      color={isSelected ? '#8B0000' : item.color || '#888'}
    />
    <View style={styles.fileInfo}>
      <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
        {item.name || 'Sin nombre'}
      </Text>
      {item.updated_at && (
        <Text style={styles.fileDetails}>
          Modificado {format(new Date(item.updated_at), 'dd MMM yyyy')}
        </Text>
      )}
    </View>
    {showMoreButton && (
      <TouchableOpacity onPress={() => activeDrawer(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color="#888" />
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

interface ListDesignBasicProps {
  documents: Document[] | undefined;
  folder?: Document;
}

const ListDesignBasic: React.FC<ListDesignBasicProps> = ({ documents, folder }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [actionDrawerField, setActionDrawerField] = useState({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeDrawer = (item: Document) => {
    setActionDrawerField({ visible: true, item });
  };

  const handleLongPress = (item: Document) => {
    if (!selectedItems.includes(item.id)) {
      setSelectedItems([...selectedItems, item.id]);
    }
  };

  const handlePress = (item: Document) => {
    if (selectedItems.length > 0) {
      if (!selectedItems.includes(item.id)) {
        setSelectedItems([...selectedItems, item.id]);
      } else {
        setSelectedItems(selectedItems.filter((id) => id !== item.id));
      }
    }
  };

  const handleDeselect = () => {
    setSelectedItems([]);
  };

  const finishMoveModal = () => {
    setMoveModalVisible(false);
    setSelectedItems([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await listDocuments({ folder_id_Null: 1 });
    setRefreshing(false);
  };

  return (
    <View style={styles.wrapper}>
      {selectedItems.length > 0 && (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={handleDeselect}>
            <Ionicons name="close" size={24} color="#8B0000" />
          </TouchableOpacity>
          <Text style={styles.selectionText}>
            {selectedItems.length} elemento(s)
          </Text>
          <View style={styles.actionIcons}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setMoveModalVisible(true)}>
              <Text style={styles.fileName}>Mover</Text>
              <Ionicons name="folder-open-outline" size={30} color="#8B0000" style={styles.iconSpacing} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <FlatList
        data={documents}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <FileItem
            item={item}
            activeDrawer={activeDrawer}
            onLongPress={handleLongPress}
            onPress={handlePress}
            isSelected={selectedItems.includes(item.id)}
            showMoreButton={selectedItems.length === 0}
            navigation={navigation}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        initialNumToRender={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No hay documentos disponibles.</Text>
        )}
      />

      <ActionDrawer field={actionDrawerField} />

      <ActionMoveModal
        visible={moveModalVisible}
        onClose={() => setMoveModalVisible(false)}
        selectedItems={selectedItems}
        finishMoveModal={finishMoveModal}
        folder={folder}
      />
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe5b4',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    elevation: 4,
    position: 'absolute',
    borderRadius: 10,
    top: -height * 0.12,
    zIndex: 1,
  },
  selectionText: {
    flex: 1,
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    color: '#8B0000',
    fontFamily: 'Karla-Bold',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginLeft: width * 0.01,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: height * 0.01,
  },
  fileInfo: {
    flex: 1,
    marginLeft: width * 0.03,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: width * 0.045,
    fontFamily: 'Karla-Bold',
    color: '#333',
  },
  fileDetails: {
    fontSize: width * 0.035,
    fontFamily: 'Karla-Regular',
    color: '#888',
  },
  selectedItem: {
    backgroundColor: '#ffe5b4',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: height * 0.02,
    fontSize: width * 0.04,
    fontFamily: 'Karla-Regular',
    color: '#888',
  },
});

export default ListDesignBasic;