"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { KeyboardAvoidingView, Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import Toast from "react-native-toast-message"
import { supabase } from "../supabase/supabaseClient"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../components/types"
import { useFormValidation } from "../hooks/useFormValidation"
import FormInput from "../components/common/FormInput"
import LoadingButton from "../components/common/LoadingButton"

interface ResetPasswordScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>
}

// Optimización 1: Reglas de validación personalizadas para reset de contraseña
const resetPasswordValidationRules = {
  newPassword: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value && value.length < 6) {
        return "La contraseña debe tener al menos 6 caracteres"
      }
      return null
    },
  },
  confirmPassword: {
    required: true,
    custom: (value: string, formData?: { [key: string]: string }) => {
      if (value && formData?.newPassword && value !== formData.newPassword) {
        return "Las contraseñas no coinciden"
      }
      return null
    },
  },
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Optimización 2: Usar hook de validación con validación personalizada
  const { errors, validateForm, clearError } = useFormValidation(resetPasswordValidationRules)

  // Optimización 3: Verificar sesión al montar el componente
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setSuccessMessage("No se detectó una sesión válida. Por favor, usa el enlace de restablecimiento.")
          Toast.show({
            type: "error",
            text1: "Sesión no válida",
            text2: "Por favor, usa el enlace de restablecimiento.",
          })
          setTimeout(() => navigation.navigate("Login"), 3000)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        navigation.navigate("Login")
      }
    }

    checkSession()
  }, [navigation])

  // Optimización 4: Función de actualización de campos optimizada
  const updateField = useCallback(
    (field: keyof typeof formData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      clearError(field)
      setSuccessMessage("")
    },
    [clearError],
  )

  // Optimización 5: Validación personalizada para confirmar contraseña
  const validateFormWithConfirmation = useCallback(
    (data: typeof formData) => {
      // Validar campos básicos
      const isValid = validateForm(data)

      // Validación adicional para confirmación de contraseña
      if (data.confirmPassword !== data.newPassword) {
        return false
      }

      return isValid
    },
    [validateForm],
  )

  // Optimización 6: Función de actualización de contraseña mejorada
  const handleUpdatePassword = useCallback(async () => {
    try {
      if (!validateFormWithConfirmation(formData)) {
        return
      }

      setLoading(true)
      setSuccessMessage("")

      const { error } = await supabase.auth.updateUser({ password: formData.newPassword })

      if (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message || "Error al actualizar la contraseña.",
        })
        return
      }

      const successMsg = "Contraseña actualizada con éxito. Redirigiendo al inicio de sesión..."
      setSuccessMessage(successMsg)

      Toast.show({
        type: "success",
        text1: "Éxito",
        text2: "Contraseña actualizada correctamente",
      })

      setTimeout(() => navigation.navigate("Login"), 2000)
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Error al actualizar la contraseña.",
      })
    } finally {
      setLoading(false)
    }
  }, [formData, validateFormWithConfirmation, navigation])

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ── Back ── */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Login")} accessibilityLabel="Volver">
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🔒</Text>
          </View>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Elige una contraseña segura para tu cuenta</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <FormInput iconName="lock-closed-outline" placeholder="Nueva contraseña" value={formData.newPassword} onChangeText={updateField("newPassword")} error={errors.newPassword} isPassword autoCapitalize="none" theme="dark" />
          <FormInput
            iconName="lock-closed-outline"
            placeholder="Confirmar contraseña"
            value={formData.confirmPassword}
            onChangeText={updateField("confirmPassword")}
            error={errors.confirmPassword || (formData.confirmPassword && formData.confirmPassword !== formData.newPassword ? "Las contraseñas no coinciden" : "")}
            isPassword
            autoCapitalize="none"
            theme="dark"
          />
          {successMessage ? (
            <View style={styles.successContainer}>
              <Text style={styles.successMessage}>{successMessage}</Text>
            </View>
          ) : null}
          <LoadingButton title="Actualizar contraseña" onPress={handleUpdatePassword} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: "#0A0A0A" },
  scrollView: { flex: 1, backgroundColor: "#0A0A0A" },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 32 },
  backButtonText: { fontFamily: "Karla-SemiBold", color: "#FF8C00", fontSize: 15 },
  header: { alignItems: "center", marginBottom: 36 },
  iconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#1C1C1E", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  iconEmoji: { fontSize: 32 },
  title: { fontFamily: "Karla-Bold", fontSize: 26, color: "#FFFFFF", marginBottom: 10, textAlign: "center" },
  subtitle: { fontFamily: "Karla-Regular", color: "#6B7280", fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: { backgroundColor: "#1C1C1E", borderRadius: 20, padding: 24 },
  successContainer: { marginBottom: 16, padding: 12, backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 10, borderLeftWidth: 3, borderLeftColor: "#10B981" },
  successMessage: { color: "#10B981", fontSize: 14, fontFamily: "Karla-Regular" },
})

export default ResetPasswordScreen
