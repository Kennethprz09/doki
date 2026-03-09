import React from "react"
import { useState } from "react"
import { View, TextInput, Text, TouchableOpacity, StyleSheet, type TextInputProps } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radii } from "../../theme"

interface FormInputProps extends TextInputProps {
  label?: string
  error?: string
  iconName?: keyof typeof Ionicons.glyphMap
  isPassword?: boolean
  containerStyle?: object
  inputStyle?: object
  theme?: "light" | "dark"
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  iconName,
  isPassword = false,
  containerStyle,
  inputStyle,
  theme = "dark",
  ...textInputProps
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const isDark = theme === "dark"
  const bg = isDark ? "#2A2A2A" : colors.gray50
  const textColor = isDark ? colors.white : colors.gray900
  const iconColor = isDark ? colors.gray400 : colors.gray500
  const placeholderColor = isDark ? "#555" : colors.gray400

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: isDark ? colors.gray300 : colors.gray700 }]}>{label}</Text>
      )}

      <View style={[styles.inputContainer, { backgroundColor: bg }, error ? styles.inputError : null]}>
        {iconName && (
          <Ionicons name={iconName} size={18} color={iconColor} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, { color: textColor }, inputStyle]}
          placeholderTextColor={placeholderColor}
          secureTextEntry={isPassword && !showPassword}
          {...textInputProps}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconRight}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputError: { borderColor: colors.error },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    height: "100%",
  },
  icon: { marginRight: 10 },
  iconRight: { padding: 4, marginLeft: 6 },
  errorMessage: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
})

export default FormInput
