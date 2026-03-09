import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radii, shadows } from "../../theme"
import type { ToastProps } from "../types"

const toastConfig = {
  success: ({ text1, text2 }: ToastProps) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={22} color={colors.success} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),

  error: ({ text1, text2 }: ToastProps) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle" size={22} color={colors.error} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),

  info: ({ text1, text2 }: ToastProps) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <View style={styles.iconWrap}>
        <Ionicons name="information-circle" size={22} color="#3B82F6" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),

  warning: ({ text1, text2 }: ToastProps) => (
    <View style={[styles.toastContainer, styles.warningToast]}>
      <View style={styles.iconWrap}>
        <Ionicons name="warning" size={22} color="#F59E0B" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    width: "90%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.xl,
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  successToast: { borderLeftWidth: 4, borderLeftColor: colors.success },
  errorToast: { borderLeftWidth: 4, borderLeftColor: colors.error },
  infoToast: { borderLeftWidth: 4, borderLeftColor: "#3B82F6" },
  warningToast: { borderLeftWidth: 4, borderLeftColor: "#F59E0B" },
  iconWrap: { marginRight: 12 },
  textContainer: { flex: 1 },
  title: {
    color: colors.gray900,
    fontSize: 15,
    fontFamily: fonts.bold,
    marginBottom: 1,
  },
  subtitle: {
    color: colors.gray500,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
})

export default toastConfig
