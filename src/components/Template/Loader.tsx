"use client"

import type React from "react"
import { View, Text, ActivityIndicator, StyleSheet } from "react-native"
import { BlurView } from "expo-blur"

interface LoaderProps {
  mensaje?: string
  size?: "small" | "large"
  color?: string
  overlay?: boolean
  blur?: boolean
}

// Optimización 1: Loader más flexible y con mejor UX
const Loader: React.FC<LoaderProps> = ({
  mensaje = "Cargando, por favor espere...",
  size = "large",
  color = "#ff8c00",
  overlay = true,
  blur = false,
}) => {
  const containerStyle = overlay ? styles.overlayContainer : styles.inlineContainer

  const LoaderContent = () => (
    <View style={styles.loaderContent}>
      <ActivityIndicator size={size} color={color} />
      <Text style={[styles.loaderText, { color: overlay ? "#333" : color }]}>{mensaje}</Text>
    </View>
  )

  if (!overlay) {
    return <LoaderContent />
  }

  return (
    <View style={containerStyle}>
      {blur ? (
        <BlurView intensity={20} style={styles.blurContainer}>
          <LoaderContent />
        </BlurView>
      ) : (
        <View style={styles.backgroundContainer}>
          <LoaderContent />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  inlineContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  blurContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContent: {
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loaderText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
    maxWidth: 200,
  },
})

export default Loader
