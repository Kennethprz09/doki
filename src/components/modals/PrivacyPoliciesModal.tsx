import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Dimensions,
  Modal,
  Animated,
  BackHandler,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radii, shadows, withAlpha } from "../../theme"
import LoadingButton from "../common/LoadingButton"

// Diferencia entre pantalla física y ventana de la app = altura de la barra de navegación Android
const WIN = Dimensions.get("window")
const SCR = Dimensions.get("screen")
const NAV_BAR_HEIGHT = Platform.OS === "android" ? Math.max(0, SCR.height - WIN.height) : 0
const BOTTOM_FILL = Math.max(32, NAV_BAR_HEIGHT + 16)

interface PrivacyPoliciesModalProps {
  visible: boolean
  onClose: () => void
}

const PrivacyPoliciesModal: React.FC<PrivacyPoliciesModalProps> = ({ visible, onClose }) => {
  const [modalVisible, setModalVisible] = useState(visible)
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current

  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start()
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setModalVisible(false),
      )
    }
  }, [visible, fadeAnim])

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (visible) { onClose(); return true }
      return false
    })
    return () => sub.remove()
  }, [visible, onClose])

  const slideY = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] })

  const handleLink = useCallback(() => {
    Linking.openURL("https://appdoki.com/politicas-de-privacidad").catch(() => {})
  }, [])

  return (
    <Modal
      transparent
      animationType="none"
      visible={modalVisible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheetWrapper,
          { opacity: fadeAnim, transform: [{ translateY: slideY }] },
        ]}
        pointerEvents="box-none"
      >
        <TouchableWithoutFeedback>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.title}>Políticas de Privacidad</Text>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.date}>Última actualización: 10/02/2026</Text>
              <Text style={styles.body}>
                <Text style={styles.bold}>ANDRES FELIPE SAAVEDRA TRUJILLO{"\n"}</Text>
                C.C.: 1130610004{"\n"}
                NIT: 1130610004 - 1{"\n"}
                Matrícula Mercantil: 1196423-1{"\n"}
                Domicilio: Cali, Valle del Cauca, Colombia{"\n"}
                Correo de contacto: soporte@appdoki.com
              </Text>
              <Text style={styles.body}>
                La presente Política de Privacidad describe cómo recopilamos, usamos y protegemos
                la información de los usuarios, en cumplimiento de la Ley 1581 de 2012 y el
                Decreto 1377 de 2013.
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.linkRow} onPress={handleLink}>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={styles.linkText}>Ver políticas completas</Text>
            </TouchableOpacity>

            <LoadingButton title="Entendido" onPress={onClose} style={styles.btn} />

            {/* Relleno que cubre la barra de navegación de Android */}
            <View style={{ height: BOTTOM_FILL }} />
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    maxHeight: SCR.height * 0.85,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: withAlpha(colors.primary, 12),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.gray900,
  },
  scroll: {
    maxHeight: 280,
    marginBottom: 16,
  },
  date: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.gray400,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray600,
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontFamily: fonts.bold,
    color: colors.gray800,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  btn: { paddingVertical: 14 },
})

export default PrivacyPoliciesModal
