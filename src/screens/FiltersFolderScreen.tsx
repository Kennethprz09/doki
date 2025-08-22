import React from "react";
import { memo, useState, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp, Document } from "../components/types";
import { useFolderDocuments } from "../hooks/useFolderDocuments";
import { useDocumentFilters } from "../hooks/useDocumentFilters";
import SearchHeader from "../components/common/SearchHeader";
import FilterControls from "../components/common/FilterControls";
import DocumentList from "../components/common/DocumentList";
import ProfileModal from "../components/modals/ProfileModal";
import ActionMenuModal from "../components/modals/ActionMenuModal";
import CreateFolderModal from "../components/modals/CreateFolderModal";
import ColorPicker from "../components/common/ColorPicker";
import { useFolderManager } from "../hooks/useFolderManager";
import { useDocumentActions } from "../hooks/useDocumentActions";

interface FiltersFolderScreenProps {
  folder: Document | null;
}

const FiltersFolderScreen: React.FC<FiltersFolderScreenProps> = memo(({ folder }) => {
  const navigation = useNavigation<NavigationProp>();
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const [selectedDocumentForActions, setSelectedDocumentForActions] = useState<Document | null>(null);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const { folderDocuments, loading, refetch } = useFolderDocuments(folder);
  const { search, setSearch, sortOrder, toggleSortOrder, filteredDocuments } = useDocumentFilters({
    documents: folderDocuments,
  });

  const { editItem, processing } = useFolderManager();
  const { updateDocumentColor } = useDocumentActions();

  const handleBack = useCallback(() => {
    console.log("Navigating back");
    navigation.goBack();
  }, [navigation]);

  const handleToggleSearch = useCallback(() => {
    console.log("Toggling search, current state:", isSearching);
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearch("");
    }
  }, [isSearching, setSearch]);

  const handleToggleView = useCallback(() => {
    console.log("Toggling view mode to:", viewMode === "list" ? "grid" : "list");
    setViewMode((prev) => (prev === "list" ? "grid" : "list"));
  }, [viewMode]);

  const handleToggleProfile = useCallback(() => {
    console.log("Toggling ProfileModal, current state:", isProfileModalVisible);
    setIsProfileModalVisible(!isProfileModalVisible);
  }, [isProfileModalVisible]);

  const handleItemActionPress = useCallback((document: Document) => {
    console.log("Opening ActionMenuModal for document:", document.id);
    setSelectedDocumentForActions(document);
    setIsActionMenuVisible(true);
  }, []);

  const handleActionMenuClose = useCallback(() => {
    console.log("Closing ActionMenuModal");
    setIsActionMenuVisible(false);
    setSelectedDocumentForActions(null);
  }, []);

  const handleActionSelect = useCallback((action: "edit" | "color", document: Document) => {
    console.log(`Action selected: ${action} for document: ${document.id}`);
    setSelectedDocumentForActions(document);
    setTimeout(() => {
      if (action === "edit") {
        console.log("Opening CreateFolderModal");
        setIsEditModalVisible(true);
      } else if (action === "color") {
        console.log("Opening ColorPicker");
        setIsColorPickerVisible(true);
      }
    }, 500);
  }, []);

  const handleEditSubmit = useCallback(
    async (newName: string) => {
      if (!selectedDocumentForActions) return false;
      console.log("Submitting edit for document:", selectedDocumentForActions.id, "newName:", newName);
      const success = await editItem(selectedDocumentForActions.id, newName);
      if (success) {
        console.log("Edit successful, closing CreateFolderModal");
        setIsEditModalVisible(false);
        handleActionMenuClose();
      } else {
        console.log("Edit failed");
      }
      return success;
    },
    [selectedDocumentForActions, editItem, handleActionMenuClose],
  );

  const handleColorSelect = useCallback(
    async (color: string) => {
      if (!selectedDocumentForActions) return false;
      console.log("Submitting color change for document:", selectedDocumentForActions.id, "color:", color);
      const success = await updateDocumentColor(selectedDocumentForActions.id, color);
      if (success) {
        console.log("Color change successful, closing ColorPicker");
        setIsColorPickerVisible(false);
        handleActionMenuClose();
      } else {
        console.log("Color change failed");
      }
      return success;
    },
    [selectedDocumentForActions, updateDocumentColor, handleActionMenuClose],
  );

  return (
    <View style={styles.container}>
      <SearchHeader
        title={folder?.name || "Carpeta"}
        backgroundColor={folder?.color || "#f8f9fa"}
        isSearching={isSearching}
        searchValue={search}
        onSearchChange={setSearch}
        onToggleSearch={handleToggleSearch}
        onBack={handleBack}
        placeholder={`Buscar en ${folder?.name || "carpeta"}`}
      />

      <FilterControls
        sortDirection={sortOrder.direction}
        onToggleSort={toggleSortOrder}
        viewMode={viewMode}
        onToggleView={handleToggleView}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ff8c00" />
          <Text style={styles.loaderText}>Cargando documentos...</Text>
        </View>
      ) : (
        <DocumentList
          documents={filteredDocuments}
          onRefresh={refetch}
          renderMode={viewMode}
          folder={folder}
          emptyMessage="No hay documentos en esta carpeta."
          onItemActionPress={handleItemActionPress}
        />
      )}

      <ProfileModal visible={isProfileModalVisible} onClose={handleToggleProfile} />

      <ActionMenuModal
        visible={isActionMenuVisible}
        onClose={handleActionMenuClose}
        document={selectedDocumentForActions}
        onActionComplete={handleActionMenuClose}
        folder={folder}
        onActionSelect={handleActionSelect}
      />

      <CreateFolderModal
        visible={isEditModalVisible}
        onClose={() => {
          console.log("Closing CreateFolderModal");
          setIsEditModalVisible(false);
        }}
        onSubmit={handleEditSubmit}
        editItem={selectedDocumentForActions}
        loading={processing}
      />

      <ColorPicker
        visible={isColorPickerVisible}
        onClose={() => {
          console.log("Closing ColorPicker");
          setIsColorPickerVisible(false);
        }}
        onColorSelect={handleColorSelect}
        selectedColor={selectedDocumentForActions?.color || undefined}
      />
    </View>
  );
});

FiltersFolderScreen.displayName = "FiltersFolderScreen";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});

export default FiltersFolderScreen;