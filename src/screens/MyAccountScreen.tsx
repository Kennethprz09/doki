"use client"

import React from "react"
import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import Toast from "react-native-toast-message"
import { useUserStore } from "../store/userStore"
import { useGlobalStore } from "../store/globalStore"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../components/types"
import { supabase } from "../supabase/supabaseClient"
import { useFormValidation, commonValidationRules } from "../hooks/useFormValidation"
import FormInput from "../components/common/FormInput"
import LoadingButton from "../components/common/LoadingButton"

// Optimización 1: Componente optimizado con mejor UX
const MyAccountScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user, setUser } = useUserStore()
  const { loading, setLoading } = useGlobalStore()

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
  })
  const [isPasswordFieldVisible, setIsPasswordFieldVisible] = useState(false)
  const passwordFieldHeight = useState(new Animated.Value(0))[0]

  // Optimización 2: Validación con reglas personalizadas
  const { errors, validateForm, clearError } = useFormValidation({
    name: commonValidationRules.name,
    surname: commonValidationRules.surname,
    password: {
      required: false, // Password es opcional
      minLength: 6,
      custom: (value: string) => {
        if (value && value.length > 0 && value.length < 6) {
          return "La contraseña debe tener al menos 6 caracteres"
        }
        return null
      },
    },
  })

  // Optimización 3: Función de actualización de campos optimizada
  const updateField = useCallback(
    (field: keyof typeof formData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      clearError(field)
    },
    [clearError],
  )

  // Optimización 4: Función para alternar campo de contraseña con animación
  const togglePasswordField = useCallback(() => {
    const newVisibility = !isPasswordFieldVisible

    if (newVisibility === false) {
      setFormData((prev) => ({ ...prev, password: "" }))
    }

    setIsPasswordFieldVisible(newVisibility)

    Animated.timing(passwordFieldHeight, {
      toValue: newVisibility ? 70 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [isPasswordFieldVisible, passwordFieldHeight])

  // Optimización 5: Función de guardado mejorada con mejor manejo de errores
  const handleSaveChanges = useCallback(async () => {
    try {
      // Validar solo los campos requeridos (name y surname)
      const requiredFields = { name: formData.name, surname: formData.surname }
      if (!validateForm(requiredFields)) {
        return
      }

      if (!user?.id) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Usuario no autenticado.",
        })
        return
      }

      setLoading(true)

      const displayName = `${formData.name.trim()} ${formData.surname.trim()}`.trim()

      // Preparar datos de actualización
      const authUpdate: any = {
        data: {
          display_name: displayName,
          name: formData.name.trim(),
          surname: formData.surname.trim(),
        },
      }

      // Solo incluir password si se proporcionó
      if (formData.password.trim()) {
        authUpdate.password = formData.password
      }

      // Actualizar autenticación
      const { error: authError } = await supabase.auth.updateUser(authUpdate)
      if (authError) {
        throw new Error(`Error al actualizar autenticación: ${authError.message}`)
      }

      // Actualizar perfil en la base de datos
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          email: user.email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )

      if (profileError) {
        throw new Error(`Error al actualizar perfil: ${profileError.message}`)
      }

      // Actualizar store local
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          display_name: displayName,
        },
      })

      Toast.show({
        type: "success",
        text1: "Éxito",
        text2: "Cambios guardados correctamente.",
      })

      // Limpiar campo de contraseña después de guardar
      if (formData.password) {
        setFormData((prev) => ({ ...prev, password: "" }))
        togglePasswordField()
      }
    } catch (error: any) {
      console.error("Error saving changes:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "No se pudieron guardar los cambios.",
      })
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm, user, setUser, setLoading, togglePasswordField])

  // Optimización 6: Cargar datos del usuario al montar
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.name || "",
        surname: user.user_metadata?.surname || "",
        email: user.email || "",
        password: "",
      })
    }
  }, [user])

  return (
    <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Mi cuenta</Text>
          </View>

          <View style={styles.formContainer}>
            <FormInput
              iconName="person-outline"
              placeholder="Nombre"
              value={formData.name}
              onChangeText={updateField("name")}
              error={errors.name}
              autoCapitalize="words"
              theme="light"
            />

            <FormInput
              iconName="person-outline"
              placeholder="Apellido"
              value={formData.surname}
              onChangeText={updateField("surname")}
              error={errors.surname}
              autoCapitalize="words"
              theme="light"
            />

            <FormInput
              iconName="mail-outline"
              placeholder="Correo electrónico"
              value={formData.email}
              editable={false}
              theme="light"
              inputStyle={styles.disabledInput}
            />

            <TouchableOpacity onPress={togglePasswordField} style={styles.changePasswordLink}>
              <Text style={styles.changePasswordText}>
                {isPasswordFieldVisible ? "Cancelar cambio de contraseña" : "Cambiar Contraseña"}
              </Text>
            </TouchableOpacity>

            {isPasswordFieldVisible && (
              <Animated.View style={[styles.passwordContainer, { height: passwordFieldHeight }]}>
                <FormInput
                  iconName="lock-closed-outline"
                  placeholder="Nueva Contraseña"
                  value={formData.password}
                  onChangeText={updateField("password")}
                  error={errors.password}
                  isPassword
                  autoCapitalize="none"
                  theme="light"
                />
              </Animated.View>
            )}

            <LoadingButton
              title="Guardar Cambios"
              onPress={handleSaveChanges}
              loading={loading}
              style={styles.saveButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: "Karla-Bold",
    color: "#333",
  },
  formContainer: {
    width: "100%",
  },
  disabledInput: {
    opacity: 0.5,
  },
  changePasswordLink: {
    marginVertical: 20,
    alignItems: "center",
  },
  changePasswordText: {
    color: "#ff8c00",
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
  },
  passwordContainer: {
    overflow: "hidden",
  },
  saveButton: {
    marginTop: 20,
  },
})

export default MyAccountScreen
