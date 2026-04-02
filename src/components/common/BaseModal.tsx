// BaseModal.tsx
import React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Modal, StyleSheet, Pressable, View, Animated, BackHandler, Dimensions } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

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
  onModalHidden?: () => void
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
  onModalHidden,
}) => {
  const [modalVisible, setModalVisible] = useState(visible)
  const fadeAnim = useState(new Animated.Value(visible ? 1 : 0))[0]
  const wasVisibleRef = useRef(visible)
  const onModalHiddenRef = useRef(onModalHidden)

  useEffect(() => {
    onModalHiddenRef.current = onModalHidden
  })

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
      wasVisibleRef.current = true
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
        if (wasVisibleRef.current) {
          wasVisibleRef.current = false
          onModalHiddenRef.current?.()
        }
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
    position === "bottom" ? styles.overlayBottom : styles.overlayCenter,
    {
      backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
      opacity: fadeAnim,
    },
  ]

  const containerAnimatedStyle = [
    position !== "bottom" && styles.container,
    {
      opacity: fadeAnim,
      transform: [
        {
          translateY: position === "bottom" ? fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [300, 0],
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
      <SafeAreaProvider>
        <Pressable style={{ flex: 1 }} onPress={handleBackdropPress}>
          <Animated.View style={overlayStyle}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animated.View style={containerAnimatedStyle}>{children}</Animated.View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </SafeAreaProvider>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
  },
  overlayCenter: {
    justifyContent: "center" as const,
  },
  overlayBottom: {
    justifyContent: "flex-end" as const,
    alignItems: "stretch" as const,
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