import React from "react"
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, type TouchableOpacityProps } from "react-native"
import { colors, fonts, radii } from "../../theme"

interface LoadingButtonProps extends TouchableOpacityProps {
  title: string
  loading?: boolean
  variant?: "primary" | "secondary" | "ghost" | "outline"
  size?: "small" | "medium" | "large"
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  title,
  loading = false,
  variant = "primary",
  size = "small",
  style,
  disabled,
  ...touchableProps
}) => {
  const buttonStyle = [styles.button, styles[variant], styles[size], (loading || disabled) && styles.disabled, style]
  const textStyle = [styles.buttonText, styles[`${variant}Text`], styles[`${size}Text`]]

  const indicatorColor =
    variant === "primary" ? colors.white :
    variant === "ghost" ? colors.gray500 :
    colors.primary

  return (
    <TouchableOpacity style={buttonStyle} disabled={loading || disabled} {...touchableProps}>
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: { backgroundColor: "transparent" },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  small: { paddingVertical: 10, paddingHorizontal: 16 },
  medium: { paddingVertical: 13, paddingHorizontal: 24 },
  large: { paddingVertical: 16, paddingHorizontal: 32 },
  disabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.bold, textAlign: "center" },
  primaryText: { color: colors.white },
  secondaryText: { color: colors.primary },
  ghostText: { color: colors.gray600 },
  outlineText: { color: colors.gray700 },
  smallText: { fontSize: 14 },
  mediumText: { fontSize: 15 },
  largeText: { fontSize: 16 },
})

export default LoadingButton
