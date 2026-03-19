import React from "react"
import { useCallback, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import Toast from "react-native-toast-message"
import { colors, fonts, radii, shadows, withAlpha } from "../../theme"
import { useUserStore } from "../../store/userStore"
import { useDocumentsStore } from "../../store/documentsStore"
import { logout } from "../../supabase/auth"
import BaseModal from "../common/BaseModal"
import ConfirmDialog from "../common/ConfirmDialog"
import type { ModalProps, NavigationProp } from "../types"

const { width } = Dimensions.get("window")

interface ProfileModalProps extends ModalProps {}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>()
  const { user } = useUserStore()
  const { clearDocuments } = useDocumentsStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = useCallback(() => {
    onClose()
    setTimeout(() => {
      setShowLogoutConfirm(true)
    }, 300)
  }, [onClose])

  const confirmLogout = useCallback(async () => {
    try {
      setShowLogoutConfirm(false)
      await logout()
      clearDocuments()
      Toast.show({ type: "success", text1: "Sesión cerrada", text2: "Has cerrado sesión correctamente" })
      navigation.navigate("Login")
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "No se pudo cerrar la sesión" })
    }
  }, [navigation, clearDocuments])

  const handleNavigateToAccount = useCallback(() => {
    onClose()
    navigation.navigate("MyAccountPage")
  }, [navigation, onClose])

  const getUserInitials = useCallback(() => {
    if (user?.name && user?.surname) return `${user.name[0]}${user.surname[0]}`.toUpperCase()
    if (user?.name) return user.name[0].toUpperCase()
    if (user?.email) return user.email[0].toUpperCase()
    return "U"
  }, [user])

  const getFullName = useCallback(() => {
    if (user?.name && user?.surname) return `${user.name} ${user.surname}`
    if (user?.name) return user.name
    return "Usuario"
  }, [user])

  return (
    <>
      <BaseModal visible={visible} onClose={onClose} position="bottom" backdropOpacity={0.5}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{getFullName()}</Text>
              <Text style={styles.userEmail}>{user?.email || "Sin correo"}</Text>
            </View>
          </View>

          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuRow} onPress={handleNavigateToAccount} accessibilityLabel="Ir a mi cuenta">
              <View style={[styles.menuIcon, { backgroundColor: withAlpha(colors.primary, 12) }]}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>Mi cuenta</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuRow} onPress={handleLogout} accessibilityLabel="Cerrar sesión">
              <View style={[styles.menuIcon, { backgroundColor: withAlpha(colors.error, 10) }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
              </View>
              <Text style={[styles.menuText, { color: colors.error }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPad} />
        </View>
      </BaseModal>

      <ConfirmDialog
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Cerrar sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmText="Cerrar sesión"
        variant="destructive"
        icon="log-out-outline"
      />
    </>
  )
}

const styles = StyleSheet.create({
  sheet: {
    width,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: "center",
    marginBottom: 20,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.gray900,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.gray500,
  },
  menu: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.gray800,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  bottomPad: { height: 20 },
})

export default ProfileModal
