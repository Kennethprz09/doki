"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { Modal, StyleSheet, TouchableWithoutFeedback, Animated, BackHandler } from "react-native"
import type { ModalProps } from "../types"

interface BaseModalProps extends ModalProps {
  animationType?: "none" | "slide" | "fade"
  transparent?: boolean
  onBackdropPress?: () => void
  backdropOpacity?: number
  children: React.ReactNode
  position?: "center" | "bottom" // Nueva prop para controlar la posición
}

// Optimización 1: Modal base reutilizable con animaciones mejoradas y posicionamiento
const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  animationType = "fade",
  transparent = true,
  onBackdropPress,
  backdropOpacity = 0.5,
  children,
  position = "center", // Valor por defecto
}) => {
  const [modalVisible, setModalVisible] = useState(visible)
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(position === "bottom" ? 300 : 0))[0] // Para animación de slide desde abajo

  // Optimización 2: Manejo del botón de retroceso en Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (visible) {
        onClose()
        return true
      }
      return false
    })

    return () => backHandler.remove()
  }, [visible, onClose])

  // Optimización 3: Animaciones suaves
  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, // Mover a la posición final (0 offset)
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: position === "bottom" ? 300 : 0, // Mover hacia abajo si es bottom, o mantener en 0 si es center
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false)
      })
    }
  }, [visible, fadeAnim, slideAnim, position])

  const handleBackdropPress = useCallback(() => {
    if (onBackdropPress) {
      onBackdropPress()
    } else {
      onClose()
    }
  }, [onBackdropPress, onClose])

  const overlayStyle = [
    styles.overlay,
    {
      backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
      opacity: fadeAnim,
      justifyContent: position === "bottom" ? "flex-end" : "center", // Posicionar al final si es 'bottom'
    },
  ]

  const containerAnimatedStyle = [
    styles.container,
    {
      opacity: fadeAnim,
      transform: [
        {
          scale: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        },
        {
          translateY: slideAnim, // Aplicar la animación de slide
        },
      ],
    },
  ]

  return (
    <Modal
      transparent={transparent}
      animationType={animationType}
      visible={modalVisible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={overlayStyle}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View style={containerAnimatedStyle}>{children}</Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
  },
  container: {
    maxWidth: "90%",
    maxHeight: "80%",
  },
})

export default BaseModal
