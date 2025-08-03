"use client"

import React from "react"
import { useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import Toast from "react-native-toast-message"
import { useUserStore } from "../../store/userStore"
import { useDocumentsStore } from "../../store/documentsStore"
import { logout } from "../../supabase/auth"
import BaseModal from "../common/BaseModal"
import type { ModalProps, NavigationProp } from "../types"

interface ProfileModalProps extends ModalProps {}

// Optimización 1: Modal de perfil mejorado con mejor UX y manejo de errores
const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>()
  const { user } = useUserStore()
  const { clearDocuments } = useDocumentsStore()

  // Optimización 2: Función de logout mejorada con confirmación
  const handleLogout = useCallback(async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await logout()
              clearDocuments()
              onClose()

              Toast.show({
                type: "success",
                text1: "Sesión cerrada",
                text2: "Has cerrado sesión correctamente",
              })

              navigation.navigate("Login")
            } catch (error) {
              console.error("Error during logout:", error)
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "No se pudo cerrar la sesión",
              })
            }
          },
        },
      ],
      { cancelable: true },
    )
  }, [navigation, onClose, clearDocuments])

  // Optimización 3: Función para navegar a mi cuenta
  const handleNavigateToAccount = useCallback(() => {
    onClose()
    navigation.navigate("MyAccountPage")
  }, [navigation, onClose])

  // Optimización 4: Generar iniciales del usuario
  const getUserInitials = useCallback(() => {
    if (user?.name && user?.surname) {
      return `${user.name[0]}${user.surname[0]}`.toUpperCase()
    }
    if (user?.name) {
      return user.name[0].toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return "U"
  }, [user])

  // Optimización 5: Obtener nombre completo del usuario
  const getFullName = useCallback(() => {
    if (user?.name && user?.surname) {
      return `${user.name} ${user.surname}`
    }
    if (user?.name) {
      return user.name
    }
    return "Usuario"
  }, [user])

  return (
    <BaseModal visible={visible} onClose={onClose} backdropOpacity={0.6}>
      <View style={styles.modalContainer}>
        {/* Header con información del usuario */}
        <View style={styles.modalHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{getFullName()}</Text>
            <Text style={styles.userEmail}>{user?.email || "Sin correo"}</Text>
          </View>
        </View>

        {/* Opciones del menú */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuOption}
            onPress={handleNavigateToAccount}
            accessibilityLabel="Ir a mi cuenta"
          >
            <Ionicons name="person-outline" size={20} color="#333" style={styles.menuIcon} />
            <Text style={styles.menuOptionText}>Mi cuenta</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={[styles.menuOption, styles.logoutOption]}
            onPress={handleLogout}
            accessibilityLabel="Cerrar sesión"
          >
            <Ionicons name="log-out-outline" size={20} color="#dc3545" style={styles.menuIcon} />
            <Text style={[styles.menuOptionText, styles.logoutText]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff8c00",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Karla-Bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Karla-Bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: "Karla-Regular",
    color: "#666",
  },
  menuContainer: {
    padding: 8,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
    width: 20,
  },
  menuOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Karla-SemiBold",
    color: "#333",
  },
  separator: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginHorizontal: 16,
  },
  logoutOption: {
    marginTop: 4,
  },
  logoutText: {
    color: "#dc3545",
  },
})

export default ProfileModal
