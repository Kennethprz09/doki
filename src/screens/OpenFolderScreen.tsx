import React from 'react';
import { View, StyleSheet } from 'react-native';
import FiltersFolderComponents from '../components/Filters/FiltersFolderComponents';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../components/types';
import NewActionComponent from '../components/NewAction/NewActionComponent';

type OpenFolderScreenRouteProp = RouteProp<RootStackParamList, 'OpenFolderPage'>;

const OpenFolderScreen: React.FC = () => {
  const route = useRoute<OpenFolderScreenRouteProp>();
  const { item: folder } = route.params;

  return (
    <View style={styles.container}>
      <FiltersFolderComponents folder={folder} />
      <NewActionComponent folder={{ folder: folder }} />
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