import type React from "react"
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.logo}>
            <Image
              source={require("../../assets/logo/logoDark.png")}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel="Logo de la aplicación"
            />
            <Text style={styles.label}>Iniciar sesión en tu cuenta</Text>
          </View>

          <View style={styles.formContainer}>
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
              autoComplete="password"
              theme="dark"
            />

            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={() => navigation.navigate("ForgotPassword")}
              accessibilityLabel="Olvidé mi contraseña"
            >
              <Text style={styles.forgotPasswordText}>Olvidé mi contraseña</Text>
            </TouchableOpacity>

            <LoadingButton title="Iniciar Sesión" onPress={handleLogin} loading={loading} />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("Register")}
              accessibilityLabel="Crear cuenta nueva"
            >
              <Text style={styles.linkText}>Crear Cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setPrivacyModalVisible(true)}
              accessibilityLabel="Ver políticas de privacidad"
            >
              <Text style={styles.linkText}>Políticas de privacidad</Text>
            </TouchableOpacity>
          </View>

          <PrivacyPoliciesModal visible={isPrivacyModalVisible} onClose={() => setPrivacyModalVisible(false)} />
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
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#ffffff",
    fontFamily: "Karla-SemiBold",
    fontSize: 14,
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

export default LoginScreen
