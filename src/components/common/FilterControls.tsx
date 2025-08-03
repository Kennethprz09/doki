"use client"

import React from "react"
import { memo } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface FilterControlsProps {
  sortDirection: "asc" | "desc"
  onToggleSort: () => void
  viewMode: "list" | "grid"
  onToggleView: () => void
  sortLabel?: string
}

// Optimización 1: Controles de filtro reutilizables
const FilterControls: React.FC<FilterControlsProps> = memo(
  ({ sortDirection, onToggleSort, viewMode, onToggleView, sortLabel = "Nombre" }) => {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.filterButton} onPress={onToggleSort} accessibilityLabel="Cambiar orden">
          <Text style={styles.filterText}>{sortLabel}</Text>
          <Ionicons name={sortDirection === "asc" ? "chevron-up" : "chevron-down"} size={20} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={onToggleView}
          accessibilityLabel={`Cambiar a vista ${viewMode === "list" ? "grid" : "lista"}`}
        >
          <Ionicons name={viewMode === "list" ? "grid-outline" : "list-outline"} size={20} color="#333" />
        </TouchableOpacity>
      </View>
    )
  },
)

FilterControls.displayName = "FilterControls"

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterText: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#333",
    marginRight: 8,
  },
  viewButton: {
    padding: 8,
  },
})

export default FilterControls
