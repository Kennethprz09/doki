import { View, StyleSheet } from 'react-native';
import FiltersComponents from '../components/Filters/FiltersComponents';
import NewActionComponent from '../components/NewAction/NewActionComponent';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <FiltersComponents filterType="all" />
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