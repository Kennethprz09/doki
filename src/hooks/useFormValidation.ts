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

// Reglas de validación predefinidas (sin custom redundantes; el hook ya valida pattern/minLength)
export const commonValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 6,
  },
  name: {
    required: true,
    minLength: 2,
  },
  surname: {
    required: true,
    minLength: 2,
  },
}
