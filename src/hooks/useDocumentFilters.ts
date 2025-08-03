"use client"

import { useMemo, useState, useCallback } from "react"
import type { Document } from "../components/types"

interface SortOrder {
  field: keyof Document
  direction: "asc" | "desc"
}

interface UseDocumentFiltersProps {
  documents: Document[] // Ahora este array ya debe venir pre-filtrado (ej. solo documentos raíz, o solo de una carpeta específica)
}

// Optimización 1: Hook reutilizable para filtros y búsqueda, ahora más genérico
export const useDocumentFilters = ({ documents }: UseDocumentFiltersProps) => {
  const [search, setSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<SortOrder>({ field: "name", direction: "asc" })

  // Optimización 2: Función para alternar orden
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => ({
      field: "name",
      direction: prev.direction === "asc" ? "desc" : "asc",
    }))
  }, [])

  // Optimización 3: Función para limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearch("")
  }, [])

  // Optimización 4: Documentos filtrados y ordenados con memoización
  const filteredDocuments = useMemo(() => {
    // Verificación defensiva
    if (!Array.isArray(documents)) {
      return []
    }

    let result = [...documents]

    // Filtrar por búsqueda
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      result = result.filter((doc) => doc.name?.toLowerCase().includes(searchLower))
    }

    // Ordenar
    result.sort((a, b) => {
      const aValue = (a[sortOrder.field] || "").toString()
      const bValue = (b[sortOrder.field] || "").toString()

      const comparison = aValue.localeCompare(bValue)
      return sortOrder.direction === "asc" ? comparison : -comparison
    })

    return result
  }, [documents, search, sortOrder]) // Eliminado filterType de las dependencias

  return {
    search,
    setSearch,
    sortOrder,
    toggleSortOrder,
    clearSearch,
    filteredDocuments,
    hasActiveFilters: search.trim().length > 0,
  }
}
