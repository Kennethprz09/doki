import React from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importa el hook de navegación

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - 60;
const IMAGE_HEIGHT = 300;

export default function SimpleCropper({ imageUri, onCrop }) {
  const navigation = useNavigation(); // Obtén el objeto de navegación

  const handleGoBack = () => {
    navigation.goBack(); // Regresa a la pantalla anterior
  };

  return (
    <View style={styles.container}>
      <Text style={styles.cropButtonText}>
        Próximamente
      </Text>
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 350,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 10,
  },
  cropButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cropButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ccc', // Color gris para diferenciar del botón de recortar
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});