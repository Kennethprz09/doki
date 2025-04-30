import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Dimensions, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import ActionDrawer from './ActionDrawer';
import ActionMoveModal from './ActionMoveModal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Document, RootStackParamList } from '../types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

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
    <View style={styles.iconContainer}>
      <Ionicons
        name={isSelected ? 'checkmark-circle-outline' : (item.icon || 'document-outline') as any}
        size={40}
        color={isSelected ? '#8B0000' : item.color || '#888'}
      />
    </View>
    <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
      {item.name || 'Sin nombre'}
    </Text>
    {item.updated_at && (
      <Text style={styles.fileDetails}>
        Modificado {format(new Date(item.updated_at), 'dd MMM yyyy')}
      </Text>
    )}
    {showMoreButton && (
      <TouchableOpacity style={styles.moreIcon} onPress={() => activeDrawer(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

interface ListDesignGridProps {
  documents: Document[];
  folder?: Document;
}

const ListDesignGrid: React.FC<ListDesignGridProps> = ({ documents, folder }) => {
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
    setTimeout(() => setRefreshing(false), 500);
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
        keyExtractor={(item) => item.id.toString()}
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
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe5b4',
    paddingHorizontal: 16,
    paddingVertical: 15,
    elevation: 4,
    position: 'absolute',
    top: -101,
    borderRadius: 10,
  },
  selectionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#8B0000',
    fontFamily: 'Karla-Bold',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginLeft: 5,
  },
  listContent: {
    paddingHorizontal: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 12,
    backgroundColor: '#555',
    padding: 16,
    borderRadius: 8,
  },
  fileItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#888',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 8,
    position: 'relative',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'Karla-Bold',
    color: '#FFF',
    textAlign: 'center',
  },
  fileDetails: {
    fontSize: 12,
    fontFamily: 'Karla-Regular',
    color: '#AAA',
    marginTop: 4,
  },
  moreIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectedItem: {
    backgroundColor: '#ffe5b4',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Karla-Regular',
    color: '#888',
  },
});

export default ListDesignGrid;