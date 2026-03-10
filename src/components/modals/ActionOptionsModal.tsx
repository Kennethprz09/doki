import React from "react";
import { memo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BaseModal from "../common/BaseModal";
import { colors, fonts, spacing, radii, withAlpha } from "../../theme";

interface ActionOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface ActionOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  options: ActionOption[];
}

const ICON_COLORS: Record<string, string> = {
  folder: "#FF9800",
  file: "#2196F3",
  scan: "#10B981",
};

const ActionOptionsModal: React.FC<ActionOptionsModalProps> = memo(({ visible, onClose, options }) => {
  const renderOption = useCallback(
    (option: ActionOption) => {
      const accent = ICON_COLORS[option.id] || colors.primary;
      return (
        <TouchableOpacity
          key={option.id}
          style={styles.option}
          onPress={() => {
            option.onPress();
            onClose();
          }}
          accessibilityLabel={option.label}
          activeOpacity={0.75}
        >
          <View style={[styles.iconContainer, { backgroundColor: withAlpha(accent, 14) }]}>
            <Ionicons name={option.icon} size={28} color={accent} />
          </View>
          <Text style={styles.optionText}>{option.label}</Text>
        </TouchableOpacity>
      );
    },
    [onClose]
  );

  return (
    <BaseModal visible={visible} onClose={onClose} backdropOpacity={0.5} position="bottom">
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>¿Qué quieres agregar?</Text>
        <View style={styles.optionsRow}>{options.map(renderOption)}</View>
        <View style={styles.bottomSpacer} />
      </View>
    </BaseModal>
  );
});

ActionOptionsModal.displayName = "ActionOptionsModal";

const styles = StyleSheet.create({
  sheet: {
    width: "100%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: radii.full,
    alignSelf: "center",
    marginBottom: spacing.base,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.gray500,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  option: {
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: radii.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.gray700,
    textAlign: "center",
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default ActionOptionsModal;
