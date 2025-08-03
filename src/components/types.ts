import type React from "react"
// Optimización 1: Tipos más específicos y completos
export interface Document {
  id: string
  name: string
  folder_id?: string | null
  is_favorite: boolean
  is_folder: boolean
  path?: string
  size?: number
  ext?: string
  color?: string
  icon?: string
  user_id: string
  created_at: string
  updated_at: string
}

// Optimización 2: Tipos adicionales para mejor tipado
export interface User {
  id: string
  email?: string
  name?: string
  surname?: string
  user_metadata?: {
    name?: string
    surname?: string
    display_name?: string
    email?: string
    avatar_url?: string
    [key: string]: any
  }
  created_at?: string
  updated_at?: string
  last_sign_in_at?: string
  [key: string]: any
}

export interface ToastProps {
  text1: string
  text2?: string
  type?: "success" | "error" | "info" | "warning"
}

export interface ModalProps {
  visible: boolean
  onClose: () => void
  children?: React.ReactNode
}

export type RootStackParamList = {
  Splash: undefined
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  ResetPassword: undefined
  MainRoutes: undefined
  Home: undefined
  Highlights: undefined
  HomePage: undefined
  HighlightsPage: undefined
  OpenFolderPage: { item: Document }
  MyAccountPage: undefined
}

// Optimización 3: Tipos para navegación
export type NavigationProp = import("@react-navigation/native-stack").NativeStackNavigationProp<RootStackParamList>

// Optimización 4: Tipos para temas
export interface Theme {
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    error: string
    success: string
    warning: string
    info: string
    border: string
    placeholder: string
  }
  fonts: {
    regular: string
    bold: string
    semiBold: string
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
}
