"use client"

import React from "react"
import { useState, useCallback } from "react"
import { KeyboardAvoidingView, Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import Toast from "react-native-toast-message"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../components/types"
import { resetPassword } from "../supabase/auth"
import { useFormValidation, commonValidationRules } from "../hooks/useFormValidation"
import FormInput from "../components/common/FormInput"
import LoadingButton from "../components/common/LoadingButton"

interface ForgotPasswordScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>
}

// Optimización 1: Componente optimizado con hooks reutilizables
const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Optimización 2: Usar hook de validación reutilizable
  const { errors, validateForm, clearError } = useFormValidation({
    email: commonValidationRules.email,
  })

  // Optimización 3: Función de actualización de email optimizada
  const updateEmail = useCallback(
    (value: string) => {
      setEmail(value)
      clearError("email")
      setSuccessMessage("") // Limpiar mensaje de éxito al cambiar email
    },
    [clearError],
  )

  // Optimización 4: Función de reset mejorada con mejor UX
  const handleResetPassword = useCallback(async () => {
    try {
      if (!validateForm({ email })) {
        return
      }

      setLoading(true)
      setSuccessMessage("")

      const { success, message, errorMessage } = await resetPassword(email)

      if (!success) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMessage || "Error al procesar la solicitud",
        })
        return
      }

      const successMsg = message || "Se ha enviado una nueva contraseña a tu correo."
      setSuccessMessage(successMsg)

      Toast.show({
        type: "success",
        text1: "Éxito",
        text2: successMsg,
      })

      // Navegar después de un delay para que el usuario vea el mensaje
      setTimeout(() => navigation.navigate("Login"), 2000)
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Error al enviar la nueva contraseña.",
      })
    } finally {
      setLoading(false)
    }
  }, [email, validateForm, navigation])

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>Ingresa tu correo para recibir una nueva contraseña</Text>
          </View>

          <View style={styles.formContainer}>
            <FormInput
              iconName="mail-outline"
              placeholder="Correo electrónico"
              value={email}
              onChangeText={updateEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              theme="dark"
            />

            {successMessage && (
              <View style={styles.successContainer}>
                <Text style={styles.successMessage}>{successMessage}</Text>
              </View>
            )}

            <LoadingButton title="Enviar Nueva Contraseña" onPress={handleResetPassword} loading={loading} />

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

export default ForgotPasswordScreen
