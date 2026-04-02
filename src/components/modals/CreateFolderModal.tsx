import React from "react"
import { memo, useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  Pressable,
  Animated,
  BackHandler,
} from "react-native"
import { colors, fonts, radii, shadows, withAlpha } from "../../theme"
import LoadingButton from "../common/LoadingButton"
import type { Document } from "../types"

const { width } = Dimensions.get("window")

interface CreateFolderModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<boolean>
  editItem?: Document | null
  loading?: boolean
}

const getFileExtension = (filename: string): string => {
  const i = filename.lastIndexOf(".")
  return i <= 0 ? "" : filename.substring(i)
}

const getFileNameWithoutExtension = (filename: string): string => {
  const i = filename.lastIndexOf(".")
  return i <= 0 ? filename : filename.substring(0, i)
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = memo(
  ({ visible, onClose, onSubmit, editItem = null, loading = false }) => {
    const [folderName, setFolderName] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [originalExtension, setOriginalExtension] = useState("")
    const [modalVisible, setModalVisible] = useState(visible)
    const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current

    const isEditing = Boolean(editItem?.id)
    const isEditingFile = isEditing && !editItem?.is_folder
    const title = isEditing ? (editItem?.is_folder ? "Editar carpeta" : "Editar archivo") : "Crear carpeta"

    useEffect(() => {
      if (visible) {
        setModalVisible(true)
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start()
      } else {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setModalVisible(false)
        })
      }
    }, [visible, fadeAnim])

    useEffect(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (visible) { onClose(); return true }
        return false
      })
      return () => sub.remove()
    }, [visible, onClose])

    useEffect(() => {
      if (visible && editItem?.name) {
        if (isEditingFile) {
          setOriginalExtension(getFileExtension(editItem.name))
          setFolderName(getFileNameWithoutExtension(editItem.name))
        } else {
          setFolderName(editItem.name)
          setOriginalExtension("")
        }
      } else if (visible && !editItem) {
        setFolderName("")
        setOriginalExtension("")
      }
    }, [visible, editItem, isEditingFile])

    const handleSubmit = useCallback(async () => {
      if (!folderName.trim()) return
      setSubmitting(true)
      const finalName = isEditingFile ? `${folderName.trim()}${originalExtension}` : folderName.trim()
      const success = await onSubmit(finalName)
      setSubmitting(false)
      if (success) {
        setFolderName("")
        setOriginalExtension("")
        onClose()
      }
    }, [folderName, onSubmit, onClose, isEditingFile, originalExtension])

    const handleClose = useCallback(() => {
      setFolderName("")
      setOriginalExtension("")
      onClose()
    }, [onClose])

    const placeholder = isEditing
      ? isEditingFile ? "Nuevo nombre del archivo" : "Nuevo nombre de la carpeta"
      : "Nombre de la carpeta"

    return (
      <Modal
        transparent
        animationType="none"
        visible={modalVisible}
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.flex} onPress={handleClose}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Pressable onPress={(e) => e.stopPropagation()}>
                  <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.card}>
                      <Text style={styles.title}>{title}</Text>

                      {isEditingFile && originalExtension ? (
                        <View style={styles.extInfo}>
                          <Text style={styles.extText}>
                            Extensión: <Text style={styles.extHighlight}>{originalExtension}</Text>
                          </Text>
                          <Text style={styles.extNote}>Se mantendrá automáticamente</Text>
                        </View>
                      ) : null}

                      <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        value={folderName}
                        onChangeText={setFolderName}
                        placeholderTextColor={colors.gray400}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                      />

                      {isEditingFile && folderName.trim() && originalExtension ? (
                        <View style={styles.preview}>
                          <Text style={styles.previewLabel}>Nombre final:</Text>
                          <Text style={styles.previewText}>
                            {folderName.trim()}
                            <Text style={styles.previewExt}>{originalExtension}</Text>
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.actions}>
                        <LoadingButton
                          title="Cancelar"
                          onPress={handleClose}
                          variant="ghost"
                          style={styles.cancelBtn}
                          disabled={submitting || loading}
                        />
                        <LoadingButton
                          title={isEditing ? "Guardar" : "Crear"}
                          onPress={handleSubmit}
                          loading={submitting || loading}
                          disabled={!folderName.trim()}
                          style={styles.submitBtn}
                        />
                      </View>
                    </View>
                  </Animated.View>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    )
  },
)

CreateFolderModal.displayName = "CreateFolderModal"

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: width * 0.9,
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 28,
    ...shadows.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.gray900,
    marginBottom: 20,
    textAlign: "center",
  },
  extInfo: {
    backgroundColor: withAlpha(colors.primary, 8),
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  extText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.gray700,
    marginBottom: 2,
  },
  extHighlight: {
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  extNote: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray500,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.gray900,
    marginBottom: 14,
    backgroundColor: colors.gray50,
  },
  preview: {
    backgroundColor: colors.gray50,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.gray500,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.gray800,
  },
  previewExt: {
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: { flex: 1, paddingVertical: 13 },
  submitBtn: { flex: 2, paddingVertical: 13 },
})

export default CreateFolderModal
