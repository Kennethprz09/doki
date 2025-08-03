"use client"

import React from "react"
import { useState } from "react"
import { View, TextInput, Text, TouchableOpacity, StyleSheet, type TextInputProps } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface FormInputProps extends TextInputProps {
  label?: string
  error?: string
  iconName?: keyof typeof Ionicons.glyphMap
  isPassword?: boolean
  containerStyle?: object
  inputStyle?: object
  theme?: "light" | "dark"
}

// Optimización 1: Componente reutilizable para inputs de formulario
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

  const themeStyles = theme === "dark" ? darkStyles : lightStyles

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, themeStyles.label]}>{label}</Text>}

      <View style={[styles.inputContainer, themeStyles.inputContainer]}>
        {iconName && <Ionicons name={iconName} size={20} color={themeStyles.iconColor} style={styles.icon} />}

        <TextInput
          style={[styles.input, themeStyles.input, inputStyle]}
          placeholderTextColor={themeStyles.placeholderColor}
          secureTextEntry={isPassword && !showPassword}
          {...textInputProps}
        />

        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconRight}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={themeStyles.iconColor} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorMessage}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: "Karla-SemiBold",
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
  },
  input: {
    flex: 1,
    fontFamily: "Karla-Regular",
    height: "100%",
  },
  icon: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
    position: "absolute",
    right: 10,
    zIndex: 1,
  },
  errorMessage: {
    color: "#ff4d4d",
    fontSize: 12,
    marginTop: 5,
    fontFamily: "Karla-Regular",
  },
})

const darkStyles = {
  label: { color: "#ffffff" },
  inputContainer: { backgroundColor: "#333333" },
  input: { color: "#ffffff" },
  iconColor: "#cccccc",
  placeholderColor: "#cccccc",
}

const lightStyles = {
  label: { color: "#333333" },
  inputContainer: { backgroundColor: "#f8f9fd" },
  input: { color: "#333333" },
  iconColor: "#8293ac",
  placeholderColor: "#a3a3a3",
}

export default FormInput
