"use client";

import React from "react";
import { memo, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing, radii } from "../../theme";

interface SearchHeaderProps {
  title: string;
  backgroundColor?: string;
  isSearching: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onToggleSearch: () => void;
  onBack: () => void;
  placeholder?: string;
}

const SearchHeader: React.FC<SearchHeaderProps> = memo(
  ({
    title,
    backgroundColor = colors.surface,
    isSearching,
    searchValue,
    onSearchChange,
    onToggleSearch,
    onBack,
    placeholder = "Buscar...",
  }) => {
    const insets = useSafeAreaInsets();

    const handleCancelSearch = useCallback(() => {
      onSearchChange("");
      onToggleSearch();
    }, [onSearchChange, onToggleSearch]);

    const isCustomColor = backgroundColor !== colors.surface && backgroundColor !== "#f8f9fa";
    const iconColor = isCustomColor ? "#FFF" : colors.gray700;
    const titleColor = isCustomColor ? "#FFF" : colors.gray900;
    const accentBg = isCustomColor ? "rgba(255,255,255,0.18)" : colors.gray100;

    const headerStyle = [styles.header, { backgroundColor, paddingTop: insets.top + 10 }];

    if (isSearching) {
      return (
        <View style={headerStyle}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: accentBg }]} onPress={handleCancelSearch} accessibilityLabel="Cancelar búsqueda">
            <Ionicons name="arrow-back" size={20} color={iconColor} />
          </TouchableOpacity>
          <View style={[styles.searchBar, { backgroundColor: accentBg }]}>
            <Ionicons name="search-outline" size={16} color={isCustomColor ? "rgba(255,255,255,0.7)" : colors.gray400} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: isCustomColor ? "#FFF" : colors.gray900 }]}
              placeholder={placeholder}
              value={searchValue}
              onChangeText={onSearchChange}
              placeholderTextColor={isCustomColor ? "rgba(255,255,255,0.5)" : colors.gray400}
              autoFocus
              returnKeyType="search"
            />
            {searchValue.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={isCustomColor ? "rgba(255,255,255,0.7)" : colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={headerStyle}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: accentBg }]} onPress={onBack} accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={20} color={iconColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>{title}</Text>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: accentBg }]} onPress={onToggleSearch} accessibilityLabel="Buscar">
          <Ionicons name="search-outline" size={20} color={iconColor} />
        </TouchableOpacity>
      </View>
    );
  }
);

SearchHeader.displayName = "SearchHeader";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 38,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    paddingVertical: 0,
  },
});

export default SearchHeader;
