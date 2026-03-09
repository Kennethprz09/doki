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
import { useGlobalStore } from "../store/globalStore"
import { checkInternetConnection } from "../utils/actions"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../components/types"
import { login } from "../supabase/auth"
import { useFormValidation, commonValidationRules } from "../hooks/useFormValidation"
import FormInput from "../components/common/FormInput"
import LoadingButton from "../components/common/LoadingButton"
import PrivacyPoliciesModal from "../components/modals/PrivacyPoliciesModal"

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>
}

// Optimización 1: Componente optimizado con hooks reutilizables
const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { loading, setLoading } = useGlobalStore()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false)

  // Optimización 2: Usar hook de validación reutilizable
  const { errors, validateForm, clearError } = useFormValidation({
    email: commonValidationRules.email,
    password: commonValidationRules.password,
  })

  // Optimización 3: Función de actualización de campos optimizada
  const updateField = useCallback(
    (field: keyof typeof formData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      clearError(field)
    },
    [clearError],
  )

  // Optimización 4: Función de login mejorada
  const handleLogin = useCallback(async () => {
    try {
      const isConnected = await checkInternetConnection()
      if (!isConnected) {
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

      const { success, errorMessage } = await login(formData.email, formData.password)

      if (success) {
        navigation.replace("MainRoutes")
      } else {
        Toast.show({
          type: "error",
          text1: "Error al iniciar sesión",
          text2: errorMessage || "Por favor, inténtalo de nuevo.",
        })
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Ocurrió un error inesperado.",
      })
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm, setLoading, navigation])

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo ── */}
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/logo/logoDark.png")}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="Logo de la aplicación"
          />
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>
          <FormInput iconName="mail-outline" placeholder="Correo electrónico" value={formData.email} onChangeText={updateField("email")} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" theme="dark" />
          <FormInput iconName="lock-closed-outline" placeholder="Contraseña" value={formData.password} onChangeText={updateField("password")} error={errors.password} isPassword autoCapitalize="none" autoComplete="password" theme="dark" />
          <TouchableOpacity style={styles.forgotPasswordLink} onPress={() => navigation.navigate("ForgotPassword")} accessibilityLabel="Olvidé mi contraseña">
            <Text style={styles.forgotPasswordText}>Olvidé mi contraseña</Text>
          </TouchableOpacity>
          <LoadingButton title="Iniciar Sesión" onPress={handleLogin} loading={loading} />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate("Register")} accessibilityLabel="Crear cuenta nueva">
            <Text style={styles.footerText}>¿No tienes cuenta? <Text style={styles.footerLink}>Crear cuenta</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPrivacyModalVisible(true)} accessibilityLabel="Ver políticas de privacidad">
            <Text style={styles.privacyText}>Políticas de privacidad</Text>
          </TouchableOpacity>
        </View>

        <PrivacyPoliciesModal visible={isPrivacyModalVisible} onClose={() => setPrivacyModalVisible(false)} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: "#0A0A0A" },
  scrollView: { flex: 1, backgroundColor: "#0A0A0A" },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: "center" },
  logoSection: { alignItems: "center", marginBottom: 0 },
  image: { width: 212, height: 202, marginBottom: 0 },
  appName: { fontSize: 34, fontFamily: "Karla-Bold", color: "#FFFFFF", letterSpacing: -0.5, marginBottom: 4 },
  tagline: { fontSize: 14, fontFamily: "Karla-Regular", color: "#6B7280" },
  card: { backgroundColor: "#1C1C1E", borderRadius: 20, padding: 24, marginBottom: 24 },
  cardTitle: { fontSize: 20, fontFamily: "Karla-Bold", color: "#FFFFFF", marginBottom: 20 },
  forgotPasswordLink: { alignSelf: "flex-end", marginBottom: 20, marginTop: 4 },
  forgotPasswordText: { color: "#FF8C00", fontFamily: "Karla-SemiBold", fontSize: 14 },
  footer: { alignItems: "center", gap: 16 },
  footerText: { fontFamily: "Karla-Regular", color: "#9CA3AF", fontSize: 14 },
  footerLink: { fontFamily: "Karla-Bold", color: "#FF8C00" },
  privacyText: { fontFamily: "Karla-Regular", color: "#6B7280", fontSize: 13 },
})

export default LoginScreen
