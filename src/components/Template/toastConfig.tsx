"use client"
import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { ToastProps } from "../types"

// Optimización 1: Configuración de toast más completa y reutilizable
const toastConfig = {
  success: ({ text1, text2 }: ToastProps) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),

  error: ({ text1, text2 }: ToastProps) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <Ionicons name="alert-circle" size={24} color="#fff" style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),

  info: ({ text1, text2 }: ToastProps) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <Ionicons name="information-circle" size={24} color="#fff" style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),

  warning: ({ text1, text2 }: ToastProps) => (
    <View style={[styles.toastContainer, styles.warningToast]}>
      <Ionicons name="warning" size={24} color="#fff" style={styles.icon} />
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
    minHeight: 60,
    width: "90%",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  successToast: {
    backgroundColor: "#28a745",
  },
  errorToast: {
    backgroundColor: "#dc3545",
  },
  infoToast: {
    backgroundColor: "#17a2b8",
  },
  warningToast: {
    backgroundColor: "#ffc107",
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Karla-Bold",
    marginBottom: 2,
  },
  subtitle: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Karla-Regular",
    opacity: 0.9,
  },
})

export default toastConfig
