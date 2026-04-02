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
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import { useUserStore } from "../store/userStore"
import { useGlobalStore } from "../store/globalStore"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../components/types"
import { supabase } from "../supabase/supabaseClient"
import { deleteAccount } from "../supabase/auth"
import { useFormValidation, commonValidationRules } from "../hooks/useFormValidation"
import FormInput from "../components/common/FormInput"
import LoadingButton from "../components/common/LoadingButton"
import ConfirmDialog from "../components/common/ConfirmDialog"
import { colors, fonts, spacing, radii, shadows, withAlpha } from "../theme"

const MyAccountScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const insets = useSafeAreaInsets()
  const { user, setUser } = useUserStore()
  const { loading, setLoading } = useGlobalStore()

  const [formData, setFormData] = useState({ name: "", surname: "", email: "", password: "" })
  const [isPasswordFieldVisible, setIsPasswordFieldVisible] = useState(false)
  const passwordFieldHeight = useState(new Animated.Value(0))[0]

  const { errors, validateForm, clearError } = useFormValidation({
    name: commonValidationRules.name,
    surname: commonValidationRules.surname,
    password: {
      required: false,
      custom: (value: string) => {
        if (value && value.length < 6) return "La contraseña debe tener al menos 6 caracteres"
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
    const next = !isPasswordFieldVisible
    if (!next) setFormData((prev) => ({ ...prev, password: "" }))
    setIsPasswordFieldVisible(next)
    Animated.timing(passwordFieldHeight, {
      toValue: next ? 72 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start()
  }, [isPasswordFieldVisible, passwordFieldHeight])

  const handleSaveChanges = useCallback(async () => {
    try {
      if (!validateForm({ name: formData.name, surname: formData.surname })) return
      if (!user?.id) {
        Toast.show({ type: "error", text1: "Error", text2: "Usuario no autenticado." })
        return
      }

      setLoading(true)
      const displayName = `${formData.name.trim()} ${formData.surname.trim()}`.trim()
      const authUpdate: any = {
        data: { display_name: displayName, name: formData.name.trim(), surname: formData.surname.trim() },
      }
      if (formData.password.trim()) authUpdate.password = formData.password

      const { error: authError } = await supabase.auth.updateUser(authUpdate)
      if (authError) throw new Error(authError.message)

      const { error: profileError } = await supabase.from("profiles").upsert(
        { id: user.id, name: formData.name.trim(), surname: formData.surname.trim(), email: user.email, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      )
      if (profileError) throw new Error(profileError.message)

      setUser({ ...user, user_metadata: { ...user.user_metadata, name: formData.name.trim(), surname: formData.surname.trim(), display_name: displayName } })
      Toast.show({ type: "success", text1: "Éxito", text2: "Cambios guardados correctamente." })

      if (formData.password) {
        setFormData((prev) => ({ ...prev, password: "" }))
        togglePasswordField()
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "No se pudieron guardar los cambios." })
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm, user, setUser, setLoading, togglePasswordField])

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteAccount = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const confirmDeleteAccount = useCallback(async () => {
    setLoading(true)
    const result = await deleteAccount()
    setLoading(false)
    if (result.success) {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] })
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.errorMessage || "No se pudo eliminar la cuenta." })
    }
  }, [setLoading, navigation])

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

  const userInitials = useMemo(() => {
    const name = user?.user_metadata?.name
    const surname = user?.user_metadata?.surname
    if (name?.length && surname?.length)
      return `${name[0]}${surname[0]}`.toUpperCase()
    if (name?.length) return name[0].toUpperCase()
    if (user?.email?.length) return user.email[0].toUpperCase()
    return "U"
  }, [user])

  const fullName = useMemo(() => {
    if (user?.user_metadata?.name && user?.user_metadata?.surname)
      return `${user.user_metadata.name} ${user.user_metadata.surname}`
    if (user?.user_metadata?.name) return user.user_metadata.name
    return "Usuario"
  }, [user])

  const canGoBack = navigation.canGoBack()

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        {canGoBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={20} color={colors.gray700} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle}>Mi cuenta</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero avatar ── */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{fullName}</Text>
          <View style={styles.emailBadge}>
            <Ionicons name="mail-outline" size={13} color={colors.gray500} />
            <Text style={styles.heroEmail}>{user?.email || "Sin correo"}</Text>
          </View>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Información personal</Text>

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
            containerStyle={styles.disabledField}
          />

          {/* ── Password toggle ── */}
          <TouchableOpacity style={styles.passwordToggle} onPress={togglePasswordField} activeOpacity={0.7}>
            <View style={styles.passwordToggleLeft}>
              <View style={styles.passwordToggleIcon}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.passwordToggleText}>
                {isPasswordFieldVisible ? "Cancelar cambio" : "Cambiar contraseña"}
              </Text>
            </View>
            <Ionicons
              name={isPasswordFieldVisible ? "chevron-up" : "chevron-forward"}
              size={16}
              color={colors.gray400}
            />
          </TouchableOpacity>

          <Animated.View style={{ height: passwordFieldHeight, overflow: "hidden" }}>
            <View style={styles.passwordInputWrap}>
              <FormInput
                iconName="lock-closed-outline"
                placeholder="Nueva contraseña"
                value={formData.password}
                onChangeText={updateField("password")}
                error={errors.password}
                isPassword
                autoCapitalize="none"
                theme="light"
              />
            </View>
          </Animated.View>

          <LoadingButton
            title="Guardar cambios"
            onPress={handleSaveChanges}
            loading={loading}
            style={styles.saveBtn}
          />
        </View>

        {/* ── Danger zone ── */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={styles.deleteBtnText}>Eliminar mi cuenta</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAccount}
        title="Eliminar cuenta"
        message="Esta acción es permanente. Se borrarán tu cuenta y todos tus datos."
        confirmText="Eliminar"
        variant="destructive"
        icon="trash-outline"
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.gray900,
  },
  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.xl },
  // Hero
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: radii.full,
    borderWidth: 3,
    borderColor: withAlpha(colors.primary, 25),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: 30,
    fontFamily: fonts.bold,
  },
  heroName: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.gray900,
    marginBottom: 6,
  },
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  heroEmail: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.gray500,
  },
  // Card
  card: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.base,
  },
  disabledField: {
    opacity: 0.55,
  },
  // Password toggle
  passwordToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    marginTop: 4,
    marginBottom: 4,
  },
  passwordToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  passwordToggleIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: withAlpha(colors.primary, 12),
    alignItems: "center",
    justifyContent: "center",
  },
  passwordToggleText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  passwordInputWrap: {
    paddingTop: 8,
  },
  saveBtn: {
    marginTop: spacing.base,
    paddingVertical: 14,
  },
  // Delete
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: spacing.base,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: withAlpha(colors.error, 8),
    borderWidth: 1,
    borderColor: withAlpha(colors.error, 15),
  },
  deleteBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.error,
  },
})

export default MyAccountScreen
