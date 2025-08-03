"use client";
import type React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import BaseModal from "../common/BaseModal";

interface LoaderProps {
  mensaje?: string;
  size?: "small" | "large";
  color?: string;
  overlay?: boolean;
  blur?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  mensaje = "Cargando, por favor espere...",
  size = "large",
  color = "#ff8c00",
  overlay = true,
  blur = false,
}) => {
  const containerStyle = overlay
    ? styles.overlayContainer
    : styles.inlineContainer;
  const LoaderContent = () => (
    <BaseModal visible={true} onClose={() => {}}>
      <View style={styles.loaderContent}>
        <ActivityIndicator size={size} color={color} />
        <Text style={[styles.loaderText, { color: overlay ? "#333" : color }]}>
          {mensaje}
        </Text>
      </View>
    </BaseModal>
  );
  if (!overlay) {
    return <LoaderContent />;
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
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center",
  },
  inlineContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 99999,
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    zIndex: 99999,
  },
  blurContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
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
    maxWidth: 200,
  },
});

export default Loader;
