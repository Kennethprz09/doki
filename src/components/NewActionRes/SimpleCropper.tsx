import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { MIN_CROP_WIDTH_CM, MIN_CROP_HEIGHT_CM, CM_TO_PIXELS } from './DocumentConstants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH;
const MIN_CROP_WIDTH = CM_TO_PIXELS(MIN_CROP_WIDTH_CM);
const MIN_CROP_HEIGHT = CM_TO_PIXELS(MIN_CROP_HEIGHT_CM);

interface SimpleCropperProps {
  imageUri: string;
  onCrop: (uri: string) => void;
  onCancel: () => void;
}

const SimpleCropper: React.FC<SimpleCropperProps> = ({ imageUri, onCrop, onCancel }) => {
  const [imageDimensions, setImageDimensions] = React.useState({ 
    width: IMAGE_SIZE, 
    height: IMAGE_SIZE 
  });
  
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cropWidth = useSharedValue(IMAGE_SIZE);
  const cropHeight = useSharedValue(IMAGE_SIZE);

  useEffect(() => {
    Image.getSize(imageUri, (imgWidth, imgHeight) => {
      const aspectRatio = imgWidth / imgHeight;
      const displayWidth = SCREEN_WIDTH;
      const displayHeight = SCREEN_WIDTH / aspectRatio;
      
      setImageDimensions({ width: displayWidth, height: displayHeight });
      
      // Tamaño inicial del recorte (mínimo 8.5x5.5 cm)
      cropWidth.value = Math.max(MIN_CROP_WIDTH, displayWidth * 0.8);
      cropHeight.value = Math.max(MIN_CROP_HEIGHT, displayHeight * 0.8);
      
      // Centrar el recorte
      translateX.value = (displayWidth - cropWidth.value) / 2;
      translateY.value = (displayHeight - cropHeight.value) / 2;
    });
  }, [imageUri]);

  // Gestos para mover el recorte
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value += e.translationX;
      translateY.value += e.translationY;
      
      // Limitar movimientos a los bordes de la imagen
      translateX.value = Math.max(
        0, 
        Math.min(
          translateX.value, 
          imageDimensions.width - cropWidth.value
        )
      );
      
      translateY.value = Math.max(
        0, 
        Math.min(
          translateY.value, 
          imageDimensions.height - cropHeight.value
        )
      );
    });

  // Gestos para redimensionar
  const resizeGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newWidth = cropWidth.value + e.translationX;
      const newHeight = cropHeight.value + e.translationY;
      
      cropWidth.value = Math.max(
        MIN_CROP_WIDTH, 
        Math.min(newWidth, imageDimensions.width - translateX.value)
      );
      
      cropHeight.value = Math.max(
        MIN_CROP_HEIGHT, 
        Math.min(newHeight, imageDimensions.height - translateY.value)
      );
    });

  const cropBoxStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: cropWidth.value,
    height: cropHeight.value,
    borderWidth: 2,
    borderColor: '#fff',
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
  }));

  const handleCrop = async () => {
    // Lógica de recorte real usando ImageManipulator
    // (Se implementa en el llamador)
    onCrop(imageUri);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.image, 
          { 
            width: imageDimensions.width, 
            height: imageDimensions.height 
          }
        ]}
        resizeMode="contain"
      />
      
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cropBoxStyle}>
          <GestureDetector gesture={resizeGesture}>
            <View style={styles.resizeHandle} />
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleCrop}>
          <Text style={styles.buttonText}>Aplicar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    width: 30,
    height: 30,
    backgroundColor: '#ff8c00',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#ff8c00',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SimpleCropper;