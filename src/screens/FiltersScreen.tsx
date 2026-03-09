// FiltersScreen.tsx
import React from "react";
import { memo, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserStore } from "../store/userStore";
import { useDocumentsStore } from "../store/documentsStore";
import { useDocumentFilters } from "../hooks/useDocumentFilters";
import FilterControls from "../components/common/FilterControls";
import DocumentList from "../components/common/DocumentList";
import ProfileModal from "../components/modals/ProfileModal";
import ActionMenuModal from "../components/modals/ActionMenuModal";
import ColorPicker from "../components/common/ColorPicker";
import CreateFolderModal from "../components/modals/CreateFolderModal";
import type { Document } from "../components/types";
import useDocumentsSync from "../hooks/useDocumentsSync";
import { useFolderManager } from "../hooks/useFolderManager";
import { useDocumentActions } from "../hooks/useDocumentActions";
import { colors, fonts, spacing, radii, shadows } from "../theme";

interface FiltersScreenProps {
  filterType: "all" | "favorites";
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

const FiltersScreen: React.FC<FiltersScreenProps> = memo(({ filterType }) => {
  const insets = useSafeAreaInsets();
  const user = useUserStore((state) => state.user);
  const documents = useDocumentsStore((state) => state.documents);
  const documentsFavorite = useDocumentsStore((state) => state.documentsFavorite);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const [selectedDocumentForActions, setSelectedDocumentForActions] = useState<Document | null>(null);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const { syncDocuments } = useDocumentsSync();
  const sourceDocuments = filterType === "all" ? documents : documentsFavorite;
  const { search, setSearch, sortOrder, toggleSortOrder, filteredDocuments } = useDocumentFilters({
    documents: sourceDocuments,
  });

  const { editItem, processing } = useFolderManager();
  const { updateDocumentColor } = useDocumentActions();

  const handleToggleView = useCallback(() => {
    setViewMode((prev) => (prev === "list" ? "grid" : "list"));
  }, []);

  const handleToggleProfile = useCallback(() => {
    setIsProfileModalVisible((prev) => !prev);
  }, []);

  const handleItemActionPress = useCallback((document: Document) => {
    setSelectedDocumentForActions(document);
    setIsActionMenuVisible(true);
  }, []);

  const handleActionMenuClose = useCallback(() => {
    setIsActionMenuVisible(false);
    setSelectedDocumentForActions(null);
  }, []);

  const handleActionSelect = useCallback((action: "edit" | "color", document: Document) => {
    setSelectedDocumentForActions(document);
    setTimeout(() => {
      if (action === "edit") setIsEditModalVisible(true);
      else if (action === "color") setIsColorPickerVisible(true);
    }, 500);
  }, []);

  const handleRefresh = useCallback(async () => {
    await syncDocuments();
  }, [syncDocuments]);

  const handleEditSubmit = useCallback(
    async (newName: string) => {
      if (!selectedDocumentForActions) return false;
      const success = await editItem(selectedDocumentForActions.id, newName);
      if (success) {
        setIsEditModalVisible(false);
        handleActionMenuClose();
      }
      return success;
    },
    [selectedDocumentForActions, editItem, handleActionMenuClose]
  );

  const handleColorSelect = useCallback(
    async (color: string) => {
      if (!selectedDocumentForActions) return false;
      const success = await updateDocumentColor(selectedDocumentForActions.id, color);
      if (success) {
        setIsColorPickerVisible(false);
        handleActionMenuClose();
      }
      return success;
    },
    [selectedDocumentForActions, updateDocumentColor, handleActionMenuClose]
  );

  const userInitials =
    user?.name && user?.surname
      ? `${user.name[0]}${user.surname[0]}`.toUpperCase()
      : user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  const firstName = user?.name || user?.user_metadata?.name || "";
  const greeting = `${getGreeting()}${firstName ? `, ${firstName}` : ""}`;
  const screenTitle = filterType === "all" ? "Mis documentos" : "Favoritos";
  const searchPlaceholder = filterType === "all" ? "Buscar en archivos..." : "Buscar en favoritos...";

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.screenTitle}>{screenTitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={handleToggleProfile}
          accessibilityLabel="Ver perfil"
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.gray400}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter controls ────────────────────────────────────────────── */}
      <FilterControls
        sortDirection={sortOrder.direction}
        onToggleSort={toggleSortOrder}
        viewMode={viewMode}
        onToggleView={handleToggleView}
        resultCount={filteredDocuments.length}
      />

      {/* ── Document list ──────────────────────────────────────────────── */}
      <DocumentList
        documents={filteredDocuments}
        onRefresh={handleRefresh}
        renderMode={viewMode}
        emptyMessage={
          filterType === "all"
            ? "No hay documentos disponibles."
            : "No tienes documentos marcados como favoritos."
        }
        onItemActionPress={handleItemActionPress}
      />

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <ProfileModal visible={isProfileModalVisible} onClose={handleToggleProfile} />

      <ActionMenuModal
        visible={isActionMenuVisible}
        onClose={handleActionMenuClose}
        document={selectedDocumentForActions}
        onActionComplete={handleActionMenuClose}
        onActionSelect={handleActionSelect}
      />

      <CreateFolderModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        editItem={selectedDocumentForActions}
        loading={processing}
      />

      <ColorPicker
        visible={isColorPickerVisible}
        onClose={() => setIsColorPickerVisible(false)}
        onColorSelect={handleColorSelect}
        selectedColor={selectedDocumentForActions?.color || undefined}
      />
    </View>
  );
});

FiltersScreen.displayName = "FiltersScreen";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.gray500,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.gray900,
    lineHeight: 28,
  },
  avatarButton: {
    marginLeft: spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  avatarText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  // ── Search ──────────────────────────────────────────────────────────────
  searchWrapper: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray100,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.gray900,
  },
});

export default FiltersScreen;
