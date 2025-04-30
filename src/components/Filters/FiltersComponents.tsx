import React, { useMemo, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileModal from '../ProfileModal';
import ListDesignBasic from '../ListDesign/ListDesignBasic';
import ListDesignGrid from '../ListDesign/ListDesignGrid';
import { useUserStore } from '../../store/userStore';
import { useDocumentsStore } from '../../store/documentsStore';
import { Document } from '../types';

interface FiltersComponentsProps {
  filterType: 'all' | 'favorites';
}

const FiltersComponents: React.FC<FiltersComponentsProps> = ({ filterType }) => {
  const user = useUserStore((state) => state.user);
  const documents = useDocumentsStore((state) => state.documents);
  const documentsFavorite = useDocumentsStore((state) => state.documentsFavorite);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState([{ field: 'name', type: 'asc' }]);
  const [typeList, setTypeList] = useState(true);
  const [isAscending, setIsAscending] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleSortOrder = () => {
    setIsAscending(!isAscending);
    setOrder([{ field: 'name', type: isAscending ? 'desc' : 'asc' }]);
  };

  const toggleList = () => {
    setTypeList(!typeList);
  };

  // Filtrar y ordenar documentos con useMemo
  const filteredDocuments = useMemo(() => {
    const sourceDocuments = filterType === 'all' ? documents : documentsFavorite;
  
    // Verificación defensiva mejorada
    if (!Array.isArray(sourceDocuments)) {
      console.warn('sourceDocuments no es un array:', {
        filterType,
        source: filterType === 'all' ? 'documents' : 'documentsFavorite',
        value: sourceDocuments,
      });
      return [];
    }
  
    let result = [...sourceDocuments];
  
    // Filtrar por búsqueda
    if (search) {
      result = result.filter((doc) =>
        doc.name.toLowerCase().includes(search.toLowerCase())
      );
    }
  
    // Filtrar por documentos sin folder_id solo para 'all'
    if (filterType === 'all') {
      result = result.filter((doc) => !doc.folder_id);
    }
  
    // Ordenar
    result.sort((a, b) => {
      const field = order[0].field as keyof Document;
      const type = order[0].type;
      const aValue = a[field] || '';
      const bValue = b[field] || '';
      return type === 'asc'
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString());
    });
  
    return result;
  }, [search, order, documents, documentsFavorite, filterType]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar en archivos"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#a3a3a3"
        />
        <TouchableOpacity style={styles.avatarContainer} onPress={toggleModal}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.name?.[0] ?? 'K'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.filterContainer} onPress={toggleSortOrder}>
          <Text style={styles.filterText}>Nombre</Text>
          <Ionicons
            name={isAscending ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#333"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rightSection} onPress={toggleList}>
          <Ionicons
            name="grid-outline"
            size={20}
            color="#333"
            style={styles.additionalIcon}
          />
        </TouchableOpacity>
      </View>

      {typeList ? (
        <ListDesignBasic documents={filteredDocuments} />
      ) : (
        <ListDesignGrid documents={filteredDocuments} />
      )}

      <ProfileModal isVisible={isModalVisible} onClose={toggleModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: 'Karla-Regular',
  },
  avatarContainer: {
    marginLeft: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff8c00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 16,
    fontFamily: 'Karla-Bold',
    marginRight: 5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalIcon: {
    marginLeft: 10,
  },
});

export default FiltersComponents;