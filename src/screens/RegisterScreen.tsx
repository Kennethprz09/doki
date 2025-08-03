"use client"

import React from "react"
import { useState, useCallback } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native"
import Toast from "react-native-toast-message"
import { useUserStore } from "../store/userStore"
import { useGlobalStore } from "../store/globalStore"
import { checkInternetConnection } from "../utils/actions"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../components/types"
import { supabase } from "../supabase/supabaseClient"
import { useFormValidation, commonValidationRules } from "../hooks/useFormValidation"
import FormInput from "../components/common/FormInput"
import LoadingButton from "../components/common/LoadingButton"

interface User {
  id: string
  email: string
  name?: string
  surname?: string
  [key: string]: any
}

interface RegisterScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>
}

// Optimización 1: Carpetas por defecto como constante
const DEFAULT_FOLDERS = [
  { name: "Cedula o tarjeta de id" },
  { name: "Tarjeta de propiedad carro o moto" },
  { name: "Pase de conduccion" },
  { name: "Pasaporte" },
  { name: "Tarjeta profesional" },
  { name: "Carnet EPS" },
  { name: "Otros" },
] as const

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { setUser } = useUserStore()
  const { loading, setLoading } = useGlobalStore()

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
  })

  // Optimización 2: Validación con reglas personalizadas
  const { errors, validateForm, clearError } = useFormValidation({
    name: commonValidationRules.name,
    surname: commonValidationRules.surname,
    email: commonValidationRules.email,
    password: commonValidationRules.password,
  })

  const updateField = useCallback(
    (field: keyof typeof formData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      clearError(field)
    },
    [clearError],
  )

  // Optimización 3: Función para crear carpetas por defecto
  const createDefaultFolders = useCallback(async (userId: string) => {
    const folderPromises = DEFAULT_FOLDERS.map((folder) =>
      supabase.from("documents").insert([
        {
          name: folder.name.trim(),
          user_id: userId,
          is_folder: true,
          icon: "folder-outline",
        },
      ]),
    )

    const results = await Promise.allSettled(folderPromises)
    const failedFolders = results.filter((result) => result.status === "rejected")

    if (failedFolders.length > 0) {
      console.warn(`Failed to create ${failedFolders.length} default folders`)
    }
  }, [])

  // Optimización 4: Función de registro mejorada
  const handleRegister = useCallback(async () => {
    try {
      const isOffline = await checkInternetConnection()
      if (isOffline) {
        Toast.show({
          type: "error",
          text1: "Sin conexión",
          text2: "Por favor, verifica tu conexión a internet.",
        })
        return
      }

      if (!validateForm(formData)) {
        return
      }

      setLoading(true)

      // Registro del usuario
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            surname: formData.surname,
          },
        },
      })

      if (error) throw error

      const user = data.user
      if (!user) {
        throw new Error("No se pudo crear el usuario")
      }

      // Crear perfil
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email || formData.email,
          name: formData.name,
          surname: formData.surname,
        },
      ])

      if (profileError) throw profileError

      // Crear carpetas por defecto
      await createDefaultFolders(user.id)

      // Actualizar store
      const userData: User = {
        id: user.id,
        email: user.email || formData.email,
        name: formData.name,
        surname: formData.surname,
      }
      setUser(userData)

      Toast.show({
        type: "success",
        text1: "Registro exitoso",
        text2: "Bienvenido a la aplicación",
      })

      navigation.replace("MainRoutes")
    } catch (error: any) {
      let errorMessage = "Error al registrarse. Por favor, inténtalo de nuevo."

      if (error.message?.includes("already registered")) {
        errorMessage = "Este correo ya está registrado"
      } else if (error.message?.includes("Password")) {
        errorMessage = "La contraseña no cumple con los requisitos"
      } else if (error.message) {
        errorMessage = error.message
      }

      Toast.show({
        type: "error",
        text1: "Error al registrarse",
        text2: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm, setLoading, setUser, navigation, createDefaultFolders])

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.logo}>
            <Image
              source={require("../../assets/logo/logoDark.png")}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel="Logo de la aplicación"
            />
            <Text style={styles.label}>Crea tu cuenta</Text>
          </View>

          <View style={styles.formContainer}>
            <FormInput
              iconName="person-circle-outline"
              placeholder="Nombre"
              value={formData.name}
              onChangeText={updateField("name")}
              error={errors.name}
              autoCapitalize="words"
              theme="dark"
            />

            <FormInput
              iconName="person-circle-outline"
              placeholder="Apellido"
              value={formData.surname}
              onChangeText={updateField("surname")}
              error={errors.surname}
              autoCapitalize="words"
              theme="dark"
            />

            <FormInput
              iconName="mail-outline"
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={updateField("email")}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              theme="dark"
            />

            <FormInput
              iconName="lock-closed-outline"
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={updateField("password")}
              error={errors.password}
              isPassword
              autoCapitalize="none"
              theme="dark"
            />

            <LoadingButton title="Continuar" onPress={handleRegister} loading={loading} />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("Login")}
              accessibilityLabel="Ir a iniciar sesión"
            >
              <Text style={styles.linkText}>Iniciar Sesión</Text>
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
  logo: {
    alignItems: "center",
    marginBottom: 30,
  },
  image: {
    width: 290,
    height: 190,
  },
  label: {
    fontFamily: "Karla-Regular",
    color: "#ffffff",
    marginBottom: 15,
    fontSize: 14,
  },
  formContainer: {
    width: "100%",
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

export default RegisterScreen
