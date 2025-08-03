"use client"

import React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
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

  const { errors, validateForm, clearError } = useFormValidation({
    name: commonValidationRules.name,
    surname: commonValidationRules.surname,
    password: {
      required: false,
      custom: (value: string) => {
        if (value && value.length >= 6) {
          return "La contraseña debe tener al menos 6 caracteres"
        }
        return null
      },
    },
  })

  const updateField = useCallback(
    (field: keyof typeof formData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      clearError(field)
    },
    [clearError],
  )

  const togglePasswordField = useCallback(() => {
    const newVisibility = !isPasswordFieldVisible

    if (newVisibility === false) {
      setFormData((prev) => ({ ...prev, password: "" }))
    }

    setIsPasswordFieldVisible(newVisibility)

    Animated.timing(passwordFieldHeight, {
      toValue: newVisibility ? 70 : 0, // Altura del FormInput
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [isPasswordFieldVisible, passwordFieldHeight])

  const handleSaveChanges = useCallback(async () => {
    try {
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

      const authUpdate: any = {
        data: {
          display_name: displayName,
          name: formData.name.trim(),
          surname: formData.surname.trim(),
        },
      }

      if (formData.password.trim()) {
        authUpdate.password = formData.password
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdate)
      if (authError) {
        throw new Error(`Error al actualizar autenticación: ${authError.message}`)
      }

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

  // ⭐ Nueva función para obtener iniciales del usuario
  const getUserInitials = useMemo(() => {
    if (user?.user_metadata?.name && user?.user_metadata?.surname) {
      return `${user.user_metadata.name[0]}${user.user_metadata.surname[0]}`.toUpperCase()
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name[0].toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return "U"
  }, [user])

  // ⭐ Nueva función para obtener nombre completo del usuario
  const getFullName = useMemo(() => {
    if (user?.user_metadata?.name && user?.user_metadata?.surname) {
      return `${user.user_metadata.name} ${user.user_metadata.surname}`
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
    }
    return "Usuario"
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
            <View style={styles.placeholder} />
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getUserInitials}</Text>
            </View>
            <Text style={styles.profileName}>{getFullName}</Text>
            <Text style={styles.profileEmail}>{user?.email || "Sin correo"}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
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

            <View style={styles.passwordSection}>
              <TouchableOpacity onPress={togglePasswordField} style={styles.changePasswordLink}>
                <Text style={styles.changePasswordText}>
                  {isPasswordFieldVisible ? "Cancelar cambio de contraseña" : "Cambiar Contraseña"}
                </Text>
                <Ionicons
                  name={isPasswordFieldVisible ? "chevron-up-outline" : "chevron-down-outline"}
                  size={18}
                  color="#ff8c00"
                />
              </TouchableOpacity>

              <Animated.View style={[styles.passwordInputContainer, { height: passwordFieldHeight }]}>
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
            </View>

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
    backgroundColor: "#f8f9fa", // Fondo más claro
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40, // Más padding al final
  },
  container: {
    flex: 1,
    alignItems: "center", // Centrar contenido
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Espacio entre elementos
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20, // Ajuste para iOS status bar
    paddingBottom: 20,
    backgroundColor: "#fff", // Fondo blanco para el header
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 22, // Título ligeramente más pequeño
    fontFamily: "Karla-Bold",
    color: "#333",
  },
  placeholder: {
    width: 24 + 10, // Ancho del icono + padding para centrar
  },
  // ⭐ Estilos para la sección de perfil
  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
    width: "100%",
    backgroundColor: "#fff",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ff8c00", // Color de acento
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32, // Tamaño de fuente más grande
    fontFamily: "Karla-Bold",
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Karla-Bold",
    color: "#333",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 15,
    fontFamily: "Karla-Regular",
    color: "#666",
  },
  formContainer: {
    width: "90%", // Ancho fijo para el formulario
    maxWidth: 500, // Máximo para pantallas grandes
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Karla-Bold",
    color: "#333",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    paddingBottom: 10,
  },
  disabledInput: {
    opacity: 0.7, // Menos opacidad para indicar deshabilitado
  },
  passwordSection: {
    marginTop: 10, // Espacio antes de la sección de contraseña
    marginBottom: 20,
  },
  changePasswordLink: {
    flexDirection: "row", // Para alinear texto e icono
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 10,
  },
  changePasswordText: {
    color: "#ff8c00",
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
  },
  passwordInputContainer: {
    overflow: "hidden",
  },
  saveButton: {
    marginTop: 10, // Espacio antes del botón de guardar
  },
})

export default MyAccountScreen
