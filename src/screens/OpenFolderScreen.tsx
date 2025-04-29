import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FiltersFolderComponents from '../components/Filters/FiltersFolderComponents';
import NewActionComponent from '../components/NewAction/NewActionComponent';
import { useDocumentsStore } from '../store/documentsStore';
import { RouteProp } from '@react-navigation/native';
import { useGlobalStore } from './src/store/globalStore';
import { RootStackParamList } from './src/components/types';
import { checkInternetConnection } from './src/utils/actions';
import { supabase } from './src/supabase/supabaseClient';

interface OpenFolderScreenProps {
  route: RouteProp<RootStackParamList, 'OpenFolderPage'>;
}

const OpenFolderScreen: React.FC<OpenFolderScreenProps> = ({ route }) => {
  const { item } = route.params;
  const setLoading = useGlobalStore((state) => state.setLoading);

  const documentsFolder = useDocumentsStore((state) => state.documentsFolder);
  const setDocumentsFolder = useDocumentsStore((state) => state.setDocumentsFolder);
  const [folderDocuments, setFolderDocuments] = useState<Document[]>([]);

  // Consultar documentos de la carpeta en Supabase
  const fetchFolderDocuments = async () => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      const cachedDocuments = documentsFolder.filter((doc) => doc.folder_id === item.id);
      setFolderDocuments(cachedDocuments);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('folder_id', item.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      setLoading(false);

      if (error) {
        throw error;
      }

      setFolderDocuments(data || []);
      setDocumentsFolder((prevDocs) => [
        ...prevDocs.filter((doc) => doc.folder_id !== item.id),
        ...(data || []),
      ]);
    } catch (error) {
      console.error('Error fetching folder documents:', error);
      const cachedDocuments = documentsFolder.filter((doc) => doc.folder_id === item.id);
      setFolderDocuments(cachedDocuments);
    }
  };

  useEffect(() => {
    fetchFolderDocuments();
  }, [item.id]);

  return (
    <View style={styles.container}>
      <FiltersFolderComponents documents={folderDocuments} folder={item} />
      <NewActionComponent folder={{ folder: item }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});

export default OpenFolderScreen;