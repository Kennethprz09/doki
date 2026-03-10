import React from "react";
import { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, radii } from "../../theme";

interface FilterControlsProps {
  sortDirection: "asc" | "desc";
  onToggleSort: () => void;
  viewMode: "list" | "grid";
  onToggleView: () => void;
  sortLabel?: string;
  resultCount?: number;
}

const FilterControls: React.FC<FilterControlsProps> = memo(
  ({ sortDirection, onToggleSort, viewMode, onToggleView, sortLabel = "Nombre", resultCount }) => {
    return (
      <View style={styles.container}>
        {/* Left: result count + sort button */}
        <View style={styles.left}>
          {resultCount !== undefined && (
            <Text style={styles.countText}>
              {resultCount} {resultCount === 1 ? "elemento" : "elementos"}
            </Text>
          )}
          <TouchableOpacity
            style={styles.sortButton}
            onPress={onToggleSort}
            accessibilityLabel="Cambiar orden"
          >
            <Ionicons
              name={sortDirection === "asc" ? "arrow-up" : "arrow-down"}
              size={13}
              color={colors.primary}
            />
            <Text style={styles.sortLabel}>{sortLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Right: view toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}
            onPress={() => viewMode !== "list" && onToggleView()}
            accessibilityLabel="Vista lista"
          >
            <Ionicons
              name="list-outline"
              size={17}
              color={viewMode === "list" ? colors.primary : colors.gray400}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "grid" && styles.toggleBtnActive]}
            onPress={() => viewMode !== "grid" && onToggleView()}
            accessibilityLabel="Vista grid"
          >
            <Ionicons
              name="grid-outline"
              size={17}
              color={viewMode === "grid" ? colors.primary : colors.gray400}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

FilterControls.displayName = "FilterControls";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.gray500,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  sortLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: colors.gray100,
    borderRadius: radii.sm,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    width: 32,
    height: 28,
    borderRadius: radii.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default FilterControls;
