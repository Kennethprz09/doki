import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Document } from '@components/types';
import ProfileModal from '../ProfileModal';
import { useUserStore } from '@src/store/userStore';
import { listDocuments } from '@src/utils/actions';
import ListDesignBasic from '../ListDesign/ListDesignBasic';
import ListDesignGrid from '../ListDesign/ListDesignGrid';

interface FiltersComponentsProps {
  documents: Document[] | undefined;
}

const FiltersComponents: React.FC<FiltersComponentsProps> = ({ documents }) => {
  const user = useUserStore((state) => state.user);
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
    setOrder([{ field: 'name', type: isAscending ? 'asc' : 'desc' }]);
    handleSearch();
  };

  const toggleList = () => {
    setTypeList(!typeList);
  };

  const handleSearch = async () => {
    await listDocuments({ name: search, order, folder_id_Null: 1 });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

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
        <ListDesignBasic documents={documents} />
      ) : (
        <ListDesignGrid documents={documents} />
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