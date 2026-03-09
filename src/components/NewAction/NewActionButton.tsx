"use client";

import React from "react";
import { memo } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, shadows } from "../../theme";

interface NewActionButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

const NewActionButton: React.FC<NewActionButtonProps> = memo(({ onPress, disabled = false }) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel="Crear nuevo documento o carpeta"
      accessibilityRole="button"
      activeOpacity={0.85}
    >
      <Ionicons name="add" size={22} color={colors.white} style={styles.icon} />
      <Text style={styles.text}>Nuevo</Text>
    </TouchableOpacity>
  );
});

NewActionButton.displayName = "NewActionButton";

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 85 : 68;

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: TAB_BAR_HEIGHT + 16,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 13,
    zIndex: 1000,
    ...shadows.lg,
  },
  disabled: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
  },
});

export default NewActionButton;
