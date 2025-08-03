import type React from "react"
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, type TouchableOpacityProps } from "react-native"

interface LoadingButtonProps extends TouchableOpacityProps {
  title: string
  loading?: boolean
  variant?: "primary" | "secondary" | "ghost" | "outline"
  size?: "small" | "medium" | "large"
}

// Optimización: Componente reutilizable para botones con loading y mejor variante ghost
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

  const textStyle = [
    styles.buttonText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (loading || disabled) && variant === "ghost" && styles.disabledGhostText,
  ]

  const getActivityIndicatorColor = () => {
    switch (variant) {
      case "primary":
        return "#fff"
      case "secondary":
      case "outline":
        return "#ff8c00"
      case "ghost":
        return "#666"
      default:
        return "#fff"
    }
  }

  return (
    <TouchableOpacity style={buttonStyle} disabled={loading || disabled} {...touchableProps}>
      {loading ? (
        <ActivityIndicator size="small" color={getActivityIndicatorColor()} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  primary: {
    backgroundColor: "#ff8c00",
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ff8c00",
  },
  ghost: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: "Karla-Bold",
    textAlign: "center",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#ff8c00",
  },
  ghostText: {
    color: "#666",
  },
  outlineText: {
    color: "#333",
  },
  disabledGhostText: {
    color: "#ccc",
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
})

export default LoadingButton
