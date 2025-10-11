// FiltersScreen.tsx
import React from "react"
import { memo, useState, useCallback } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { useUserStore } from "../store/userStore"
import { useDocumentsStore } from "../store/documentsStore"
import { useDocumentFilters } from "../hooks/useDocumentFilters"
import FilterControls from "../components/common/FilterControls"
import DocumentList from "../components/common/DocumentList"
import ProfileModal from "../components/modals/ProfileModal"
import ActionMenuModal from "../components/modals/ActionMenuModal"
import ColorPicker from "../components/common/ColorPicker"
import CreateFolderModal from "../components/modals/CreateFolderModal"
import type { Document } from "../components/types"
import useDocumentsSync from "../hooks/useDocumentsSync"
import { useFolderManager } from "../hooks/useFolderManager"
import { useDocumentActions } from "../hooks/useDocumentActions"

interface FiltersScreenProps {
  filterType: "all" | "favorites"
}

const FiltersScreen: React.FC<FiltersScreenProps> = memo(({ filterType }) => {
  const user = useUserStore((state) => state.user)
  const documents = useDocumentsStore((state) => state.documents)
  const documentsFavorite = useDocumentsStore((state) => state.documentsFavorite)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false)
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false)
  const [selectedDocumentForActions, setSelectedDocumentForActions] = useState<Document | null>(null)
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)

  const { syncDocuments } = useDocumentsSync()
  const sourceDocuments = filterType === "all" ? documents : documentsFavorite
  const { search, setSearch, sortOrder, toggleSortOrder, filteredDocuments } = useDocumentFilters({
    documents: sourceDocuments,
  })

  const { editItem, processing } = useFolderManager()
  const { updateDocumentColor } = useDocumentActions()

  const handleToggleView = useCallback(() => {
    setViewMode((prev) => (prev === "list" ? "grid" : "list"))
  }, [])

  const handleToggleProfile = useCallback(() => {
    setIsProfileModalVisible(!isProfileModalVisible)
  }, [isProfileModalVisible])

  const handleItemActionPress = useCallback((document: Document) => {
    setSelectedDocumentForActions(document)
    setIsActionMenuVisible(true)
  }, [])

  const handleActionMenuClose = useCallback(() => {
    setIsActionMenuVisible(false)
    setSelectedDocumentForActions(null)
  }, [])

  const handleActionSelect = useCallback((action: "edit" | "color", document: Document) => {
    setSelectedDocumentForActions(document)
    setTimeout(() => {
      if (action === "edit") {
        setIsEditModalVisible(true)
      } else if (action === "color") {
        setIsColorPickerVisible(true)
      }
    }, 500) // Aumentamos el retraso a 500ms
  }, [])

  const userInitials = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  const handleRefresh = useCallback(async () => {
    await syncDocuments()
  }, [syncDocuments])

  const handleEditSubmit = useCallback(
    async (newName: string) => {
      if (!selectedDocumentForActions) return false
      const success = await editItem(selectedDocumentForActions.id, newName)
      if (success) {
        setIsEditModalVisible(false)
        handleActionMenuClose()
      }
      return success
    },
    [selectedDocumentForActions, editItem, handleActionMenuClose],
  )

  const handleColorSelect = useCallback(
    async (color: string) => {
      if (!selectedDocumentForActions) return false
      const success = await updateDocumentColor(selectedDocumentForActions.id, color)
      if (success) {
        setIsColorPickerVisible(false)
        handleActionMenuClose()
      }
      return success
    },
    [selectedDocumentForActions, updateDocumentColor, handleActionMenuClose],
  )

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={filterType === "all" ? "Buscar en archivos" : "Buscar en favoritos"}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#a3a3a3"
        />
        <TouchableOpacity style={styles.avatarContainer} onPress={handleToggleProfile}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FilterControls
        sortDirection={sortOrder.direction}
        onToggleSort={toggleSortOrder}
        viewMode={viewMode}
        onToggleView={handleToggleView}
      />

      <DocumentList
        documents={filteredDocuments}
        onRefresh={handleRefresh}
        renderMode={viewMode}
        emptyMessage={
          filterType === "all" ? "No hay documentos disponibles." : "No tienes documentos marcados como favoritos."
        }
        onItemActionPress={handleItemActionPress}
      />

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
        onClose={() => {
          setIsEditModalVisible(false)
        }}
        onSubmit={handleEditSubmit}
        editItem={selectedDocumentForActions}
        loading={processing}
      />

      <ColorPicker
        visible={isColorPickerVisible}
        onClose={() => {
          setIsColorPickerVisible(false)
        }}
        onColorSelect={handleColorSelect}
        selectedColor={selectedDocumentForActions?.color || undefined}
      />
    </View>
  )
})

FiltersScreen.displayName = "FiltersScreen"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    backgroundColor: "#F1F3F4",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: "Karla-Regular",
    color: "#333",
  },
  avatarContainer: {
    marginLeft: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff8c00",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Karla-Bold",
  },
})

export default FiltersScreen