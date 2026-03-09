"use client";
import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import BaseModal from "../common/BaseModal";
import { colors, fonts, radii, shadows } from "../../theme";

interface LoaderProps {
  mensaje?: string;
  size?: "small" | "large";
  color?: string;
  overlay?: boolean;
  blur?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  mensaje = "Cargando...",
  size = "large",
  color = colors.primary,
  overlay = true,
  blur = false,
}) => {
  const LoaderContent = () => (
    <BaseModal visible={true} onClose={() => {}}>
      <View style={styles.loaderContent}>
        <ActivityIndicator size={size} color={color} />
        <Text style={styles.loaderText}>{mensaje}</Text>
      </View>
    </BaseModal>
  );

  if (!overlay) return <LoaderContent />;

  return (
    <View style={styles.overlayContainer}>
      {blur ? (
        <BlurView intensity={20} style={styles.fillContainer}>
          <LoaderContent />
        </BlurView>
      ) : (
        <View style={styles.fillContainer}>
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
  fillContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  loaderContent: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
  loaderText: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.gray700,
    maxWidth: 200,
  },
});

export default Loader;
