import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PreviewModal: React.FC<{
  imageUri: string;
  onRetake: () => void;
  onCrop: () => void;
  onRotate: (degrees: number) => void;
  onAccept: () => void;
  isFront: boolean;
  hasBackImage: boolean;
}> = ({ imageUri, onRetake, onCrop, onRotate, onAccept, isFront, hasBackImage }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isFront ? "Vista Previa Frontal" : "Vista Previa Trasera"}
      </Text>
      
      <Image 
        source={{ uri: imageUri }} 
        style={styles.previewImage} 
        resizeMode="contain"
      />
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={onRetake}>
          <Ionicons name="camera-reverse" size={28} color="white" />
          <Text style={styles.controlText}>Repetir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={onCrop}>
          <Ionicons name="crop" size={28} color="white" />
          <Text style={styles.controlText}>Recortar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={() => onRotate(-90)}>
          <Ionicons name="refresh" size={28} color="white" />
          <Text style={styles.controlText}>Rotar</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
        <Text style={styles.acceptText}>
          {hasBackImage || !isFront ? "Finalizar" : "Continuar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
  },
  previewImage: {
    width: '90%',
    height: '60%',
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  controlButton: {
    alignItems: 'center',
    padding: 15,
  },
  controlText: {
    color: 'white',
    marginTop: 5,
  },
  acceptButton: {
    backgroundColor: '#ff8c00',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 30,
  },
  acceptText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default PreviewModal;