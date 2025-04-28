import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoaderProps {
  mensaje?: string;
}

const Loader: React.FC<LoaderProps> = ({ mensaje }) => {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loaderText}>
        {mensaje || 'Cargando por favor espere...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: '10%',
    textAlign: 'center',
    left: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffffcf',
  },
  loaderText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#333',
    fontFamily: 'Karla-Bold',
  },
});

export default Loader;