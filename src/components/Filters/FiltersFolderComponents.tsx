import React, { useState, useEffect, useMemo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ListDesignBasic from '../ListDesign/ListDesignBasic';
import ListDesignGrid from '../ListDesign/ListDesignGrid';
import ProfileModal from '../ProfileModal';
import { RootStackParamList, Document } from '../types';
import { checkInternetConnection } from '../../utils/actions';
import { supabase } from '../../supabase/supabaseClient';
import { useDocumentsStore } from '../../store/documentsStore';
import { shallow } from 'zustand/shallow';

interface FiltersFolderComponentsProps {
  folder: Document | null;
}

const FiltersFolderComponents: React.FC<FiltersFolderComponentsProps> = ({ folder }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<{ field: string; type: 'asc' | 'desc' }>({ field: 'name', type: 'asc' });
  const [typeList, setTypeList] = useState(true);
  const [isAscending, setIsAscending] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Selector estabilizado con useMemo
  const documents = useDocumentsStore((state) => state.documents, shallow);
  const filteredDocs = useMemo(
    () => documents.filter((doc) => doc.folder_id === folder?.id),
    [documents, folder?.id]
  );

  // Filtrar y ordenar documentos con useMemo
  const filteredDocuments = useMemo(() => {
    let result = [...filteredDocs];

    if (search) {
      result = result.filter((doc) => doc.name.toLowerCase().includes(search.toLowerCase()));
    }

    result.sort((a, b) => {
      const field = order.field as keyof Document;
      const type = order.type;
      const aValue = a[field] || '';
      const bValue = b[field] || '';
      return type === 'asc'
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString());
    });

    return result;
  }, [filteredDocs, search, order]);

  // Función para búsqueda en línea
  const handleOnlineSearch = async () => {
    if (!folder?.id || checkInternetConnection()) return;

    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('folder_id', folder.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      query = query.order(order.field, { ascending: order.type === 'asc' });

      const { data, error } = await query;
      if (error) throw error;
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  // Ejecutar búsqueda solo cuando cambian search u order
  useEffect(() => {
    handleOnlineSearch();
  }, [search, order, folder?.id]);

  const toggleModal = () => setModalVisible(!isModalVisible);
  const toggleSortOrder = () => {
    setIsAscending(!isAscending);
    setOrder({ field: 'name', type: isAscending ? 'desc' : 'asc' });
  };
  const toggleList = () => setTypeList(!typeList);

  return (
    <View style={styles.container}>
      {isSearching ? (
        <View style={[styles.header, { backgroundColor: folder?.color || '#f8e8e8' }]}>
          <TouchableOpacity onPress={() => setIsSearching(false)}>
            <Ionicons name="arrow-back-outline" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={`Buscar en ${folder?.name || 'Carpeta'}`}
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#a3a3a3"
              autoFocus
            />
          </View>
        </View>
      ) : (
        <View style={[styles.header, { backgroundColor: folder?.color || '#f8e8e8' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{folder?.name || 'Carpeta'}</Text>
          <View style={styles.icons}>
            <TouchableOpacity onPress={() => setIsSearching(true)}>
              <Ionicons name="search-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
          <Ionicons name="grid-outline" size={20} color="#333" style={styles.additionalIcon} />
        </TouchableOpacity>
      </View>

      {typeList ? (
        <ListDesignBasic documents={filteredDocuments} folder={folder} />
      ) : (
        <ListDesignGrid documents={filteredDocuments} folder={folder} />
      )}

      <ProfileModal isVisible={isModalVisible} onClose={toggleModal} />
    </View>
  );
};

// Estilos (sin cambios)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    marginHorizontal: 8,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Karla-Regular', color: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 56,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    marginBottom: 10,
  },
  title: { fontSize: 18, fontFamily: 'Karla-Bold', color: '#FFF', flex: 1, marginLeft: 10 },
  icons: { flexDirection: 'row', alignItems: 'center' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  filterContainer: { flexDirection: 'row', alignItems: 'center' },
  filterText: { fontSize: 16, fontFamily: 'Karla-Bold', marginRight: 5 },
  rightSection: { flexDirection: 'row', alignItems: 'center' },
  additionalIcon: { marginLeft: 10 },
});

export default FiltersFolderComponents;