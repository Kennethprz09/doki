import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - 60;
const IMAGE_HEIGHT = 300;

export default function SimpleCropper({ imageUri, onCrop }) {
  const [imageDimensions, setImageDimensions] = useState({ width: IMAGE_WIDTH, height: IMAGE_HEIGHT });
  const cropSize = useSharedValue(180); // Tamaño inicial del cuadro
  const translateX = useSharedValue(0); // Posición X del cuadro
  const translateY = useSharedValue(0); // Posición Y del cuadro

  // Obtener dimensiones de la imagen y centrar el cuadro al cargar
  useEffect(() => {
    Image.getSize(imageUri, (width, height) => {
      setImageDimensions({ width, height });
      // Calcular posición inicial centrada
      const initialX = (width - cropSize.value) / 2;
      const initialY = (height - cropSize.value) / 2;
      translateX.value = initialX;
      translateY.value = initialY;
    });
  }, [imageUri]);

  // Manejador para mover el cuadro
  const panGesture = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      let newX = ctx.startX + event.translationX;
      let newY = ctx.startY + event.translationY;
      // Limitar el movimiento dentro de la imagen
      newX = Math.max(0, Math.min(newX, imageDimensions.width - cropSize.value));
      newY = Math.max(0, Math.min(newY, imageDimensions.height - cropSize.value));
      translateX.value = newX;
      translateY.value = newY;
    },
  });

  // Manejador para redimensionar el cuadro
  const resizeGesture = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startSize = cropSize.value;
    },
    onActive: (event, ctx) => {
      const newSize = ctx.startSize + event.translationX; // Cambiar tamaño basado en el arrastre
      // Limitar el tamaño mínimo y máximo
      cropSize.value = Math.max(50, Math.min(newSize, Math.min(imageDimensions.width, imageDimensions.height)));
      // Recalcular posición para mantener el cuadro centrado al redimensionar
      translateX.value = (imageDimensions.width - cropSize.value) / 2;
      translateY.value = (imageDimensions.height - cropSize.value) / 2;
    },
  });

  // Estilo animado del cuadro de recorte
  const cropStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: cropSize.value,
    height: cropSize.value,
    borderWidth: 2,
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 8,
    zIndex: 10,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Estilo de los puntos en las esquinas
  const cornerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#ff4444',
    borderRadius: 6,
    zIndex: 11,
  }));

  // Función para ejecutar el recorte
  const handleCrop = () => {
    onCrop({
      originX: Math.round(translateX.value),
      originY: Math.round(translateY.value),
      width: Math.round(cropSize.value),
      height: Math.round(cropSize.value),
    });
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      <PanGestureHandler onGestureEvent={panGesture}>
        <Animated.View style={[cropStyle, { pointerEvents: 'auto' }]}>
          <PanGestureHandler onGestureEvent={resizeGesture}>
            <Animated.View style={[cornerStyle, { top: -6, left: -6 }]} /> {/* Esquina superior izquierda */}
          </PanGestureHandler>
          <PanGestureHandler onGestureEvent={resizeGesture}>
            <Animated.View style={[cornerStyle, { top: -6, right: -6 }]} /> {/* Esquina superior derecha */}
          </PanGestureHandler>
          <PanGestureHandler onGestureEvent={resizeGesture}>
            <Animated.View style={[cornerStyle, { bottom: -6, left: -6 }]} /> {/* Esquina inferior izquierda */}
          </PanGestureHandler>
          <PanGestureHandler onGestureEvent={resizeGesture}>
            <Animated.View style={[cornerStyle, { bottom: -6, right: -6 }]} /> {/* Esquina inferior derecha */}
          </PanGestureHandler>
        </Animated.View>
      </PanGestureHandler>
      <TouchableOpacity style={styles.cropButton} onPress={handleCrop}>
        <Text style={styles.cropButtonText}>RECORTAR</Text>
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
});
