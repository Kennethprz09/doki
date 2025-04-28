import { View, StyleSheet } from 'react-native';
import FiltersComponents from '../components/Filters/FiltersComponents';
import NewActionComponent from '../components/NewAction/NewActionComponent';
import { useEffect } from 'react';
import { listDocuments } from '../utils/actions';
import { useDocumentsStore } from '../store/documentsStore';

const HomeScreen = () => {
  const documents = useDocumentsStore((state) => state.documents);

  useEffect(() => {
    // listDocuments({});
  }, []);

  return (
    <View style={styles.container}>
      <FiltersComponents documents={documents} />
      
      <NewActionComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});

export default HomeScreen;