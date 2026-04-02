import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts, radii, shadows, withAlpha } from "../../theme"
import BaseModal from "./BaseModal"

const { width } = Dimensions.get("window")

interface ConfirmDialogProps {
  visible: boolean
  onClose: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
  icon?: keyof typeof Ionicons.glyphMap
  onModalHidden?: () => void
}

interface SheetProps extends Omit<ConfirmDialogProps, "visible"> {
  accentColor: string
  iconName: keyof typeof Ionicons.glyphMap
}

// Componente interno: renderiza dentro del SafeAreaProvider de BaseModal,
// por lo que useSafeAreaInsets() lee los insets reales del sistema.
const SheetContent: React.FC<SheetProps> = ({
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  accentColor,
  iconName,
}) => {
  const insets = useSafeAreaInsets()

  const handleConfirm = () => {
    onClose()
    onConfirm()
  }

  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
      <View style={styles.handle} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: withAlpha(accentColor, 12) }]}>
        <Ionicons name={iconName} size={30} color={accentColor} />
      </View>

      {/* Text */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel ?? onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>{cancelText}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: accentColor }]}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmText}>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  onClose,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "default",
  icon,
  onModalHidden,
}) => {
  const isDestructive = variant === "destructive"
  const accentColor = isDestructive ? colors.error : colors.primary
  const iconName = icon || (isDestructive ? "alert-circle-outline" : "help-circle-outline")

  return (
    <BaseModal visible={visible} onClose={onClose} position="bottom" backdropOpacity={0.45} onModalHidden={onModalHidden}>
      <SheetContent
        onClose={onClose}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        accentColor={accentColor}
        iconName={iconName}
      />
    </BaseModal>
  )
}

const styles = StyleSheet.create({
  sheet: {
    width,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    marginBottom: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.gray900,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray500,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.gray100,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.gray600,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: radii.lg,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
  },
})

export default ConfirmDialog
