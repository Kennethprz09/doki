"use client"

import type React from "react"
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Restablecer Contraseña</Text>
            <Text style={styles.subtitle}>Ingresa tu nueva contraseña</Text>
          </View>

          <View style={styles.formContainer}>
            <FormInput
              iconName="lock-closed-outline"
              placeholder="Nueva contraseña"
              value={formData.newPassword}
              onChangeText={updateField("newPassword")}
              error={errors.newPassword}
              isPassword
              autoCapitalize="none"
              theme="dark"
            />

            <FormInput
              iconName="lock-closed-outline"
              placeholder="Confirmar contraseña"
              value={formData.confirmPassword}
              onChangeText={updateField("confirmPassword")}
              error={
                errors.confirmPassword ||
                (formData.confirmPassword && formData.confirmPassword !== formData.newPassword
                  ? "Las contraseñas no coinciden"
                  : "")
              }
              isPassword
              autoCapitalize="none"
              theme="dark"
            />

            {successMessage && (
              <View style={styles.successContainer}>
                <Text style={styles.successMessage}>{successMessage}</Text>
              </View>
            )}

            <LoadingButton title="Actualizar Contraseña" onPress={handleUpdatePassword} loading={loading} />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("Login")}
              accessibilityLabel="Volver al inicio de sesión"
            >
              <Text style={styles.linkText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "black",
  },
  container: {
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontFamily: "Karla-Bold",
    fontSize: 24,
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: "Karla-Regular",
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  successContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "rgba(40, 167, 69, 0.1)",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  successMessage: {
    color: "#28a745",
    fontSize: 14,
    fontFamily: "Karla-Regular",
  },
  linkButton: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  linkText: {
    fontFamily: "Karla-SemiBold",
    color: "#ffffff",
  },
})

export default ResetPasswordScreen
