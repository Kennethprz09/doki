"use client"

import React from "react"
import { memo, useCallback } from "react"
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface SearchHeaderProps {
  title: string
  backgroundColor?: string
  isSearching: boolean
  searchValue: string
  onSearchChange: (value: string) => void
  onToggleSearch: () => void
  onBack: () => void
  placeholder?: string
}

// Optimización 1: Header de búsqueda reutilizable
const SearchHeader: React.FC<SearchHeaderProps> = memo(
  ({
    title,
    backgroundColor = "#f8f9fa",
    isSearching,
    searchValue,
    onSearchChange,
    onToggleSearch,
    onBack,
    placeholder = "Buscar...",
  }) => {
    // Optimización 2: Función para cancelar búsqueda
    const handleCancelSearch = useCallback(() => {
      onSearchChange("")
      onToggleSearch()
    }, [onSearchChange, onToggleSearch])

    if (isSearching) {
      return (
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={handleCancelSearch} accessibilityLabel="Cancelar búsqueda">
            <Ionicons name="arrow-back-outline" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              value={searchValue}
              onChangeText={onSearchChange}
              placeholderTextColor="#a3a3a3"
              autoFocus
              returnKeyType="search"
            />
          </View>
        </View>
      )
    }

    return (
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={onBack} accessibilityLabel="Volver">
          <Ionicons name="arrow-back-outline" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        <TouchableOpacity onPress={onToggleSearch} accessibilityLabel="Buscar">
          <Ionicons name="search-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    )
  },
)

SearchHeader.displayName = "SearchHeader"

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Karla-Bold",
    color: "#333",
    flex: 1,
    marginLeft: 16,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: "#F1F3F4",
    borderRadius: 8,
    marginHorizontal: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Karla-Regular",
    color: "#333",
    paddingVertical: 8,
  },
})

export default SearchHeader
