import { View, StyleSheet, Text } from 'react-native';
import FiltersComponents from '../components/Filters/FiltersComponents';
import NewActionComponent from '../components/NewAction/NewActionComponent';

const HighlightsScreen = () => {
  return (
    <View style={styles.container}>
      <FiltersComponents filterType="favorites" />
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

export default HighlightsScreen;