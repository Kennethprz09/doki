"use client"

import { useState, useCallback } from "react"

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface FormErrors {
  [key: string]: string
}

// Optimización 1: Hook reutilizable para validación de formularios
export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<FormErrors>({})

  const validateField = useCallback(
    (fieldName: string, value: string): string | null => {
      const rule = rules[fieldName]
      if (!rule) return null

      if (rule.required && (!value || value.trim() === "")) {
        return `${fieldName} es obligatorio`
      }

      if (rule.minLength && value.length < rule.minLength) {
        return `${fieldName} debe tener al menos ${rule.minLength} caracteres`
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return `${fieldName} no puede tener más de ${rule.maxLength} caracteres`
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return `${fieldName} no tiene un formato válido`
      }

      if (rule.custom) {
        return rule.custom(value)
      }

      return null
    },
    [rules],
  )

  const validateForm = useCallback(
    (formData: { [key: string]: string }): boolean => {
      const newErrors: FormErrors = {}

      Object.keys(rules).forEach((fieldName) => {
        const error = validateField(fieldName, formData[fieldName] || "")
        if (error) {
          newErrors[fieldName] = error
        }
      })

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [rules, validateField],
  )

  const clearError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
  }
}

// Optimización 2: Reglas de validación predefinidas
export const commonValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Por favor, ingresa un correo electrónico válido"
      }
      return null
    },
  },
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value && value.length < 6) {
        return "La contraseña debe tener al menos 6 caracteres"
      }
      return null
    },
  },
  name: {
    required: true,
    minLength: 2,
    custom: (value: string) => {
      if (value && value.trim().length < 2) {
        return "El nombre debe tener al menos 2 caracteres"
      }
      return null
    },
  },
  surname: {
    required: true,
    minLength: 2,
    custom: (value: string) => {
      if (value && value.trim().length < 2) {
        return "El apellido debe tener al menos 2 caracteres"
      }
      return null
    },
  },
}
