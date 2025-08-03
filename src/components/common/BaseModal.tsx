"use client"
import React from "react"
import { useCallback, useEffect, useState } from "react"
import { Modal, StyleSheet, TouchableWithoutFeedback, Animated, BackHandler, Dimensions } from "react-native"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

interface ModalProps {
  visible: boolean
  onClose: () => void
}

interface BaseModalProps extends ModalProps {
  animationType?: "none" | "slide" | "fade"
  transparent?: boolean
  onBackdropPress?: () => void
  backdropOpacity?: number
  children: React.ReactNode
  position?: "center" | "bottom"
  fullScreen?: boolean // ⭐ Nueva prop
}

const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  animationType = "fade",
  transparent = true,
  onBackdropPress,
  backdropOpacity = 0.5,
  children,
  position = "center",
  fullScreen = false, // ⭐ Valor por defecto
}) => {
  const [modalVisible, setModalVisible] = useState(visible)
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(position === "bottom" ? 300 : 0))[0]

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
          toValue: 0,
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
          toValue: position === "bottom" ? 300 : 0,
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
      justifyContent: position === "bottom" ? "flex-end" : "center",
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
          translateY: slideAnim,
        },
      ],
    },
    fullScreen && styles.fullScreenContainer, // ⭐ Aplicar estilo fullScreen
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
  fullScreenContainer: {
    width: screenWidth, // ⭐ Ocupar todo el ancho
    height: screenHeight, // ⭐ Ocupar toda la altura
    maxWidth: screenWidth, // ⭐ Anular maxWidth
    maxHeight: screenHeight, // ⭐ Anular maxHeight
    borderRadius: 0, // ⭐ Quitar borderRadius si lo tiene
  },
})

export default BaseModal
