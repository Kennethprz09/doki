// BaseModal.tsx
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
  fullScreen?: boolean
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
  fullScreen = false,
}) => {
  const [modalVisible, setModalVisible] = useState(visible)
  const fadeAnim = useState(new Animated.Value(visible ? 1 : 0))[0] // Iniciar con valor correcto

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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false)
      })
    }
  }, [visible, fadeAnim])

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
          translateY: position === "bottom" ? fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [300, 0], // Simple slide para posición bottom
          }) : 0,
        },
      ],
    },
    fullScreen && styles.fullScreenContainer,
  ]

  return (
    <Modal
      transparent={transparent}
      animationType="none" // Desactivamos animationType nativo para usar solo Animated
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
    width: screenWidth,
    height: screenHeight,
    maxWidth: screenWidth,
    maxHeight: screenHeight,
    borderRadius: 0,
  },
})

export default BaseModal