"use client"

import type React from "react"
import { memo, useState, useCallback } from "react"
import { View, StyleSheet } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NavigationProp, Document } from "../components/types"
import { useFolderDocuments } from "../hooks/useFolderDocuments" // Importar el hook de carpeta
import { useDocumentFilters } from "../hooks/useDocumentFilters" // Importar el hook de filtros genérico
import SearchHeader from "../components/common/SearchHeader"
import FilterControls from "../components/common/FilterControls"
import DocumentList from "../components/common/DocumentList"
import ProfileModal from "../components/modals/ProfileModal"
import ActionMenuModal from "../components/modals/ActionMenuModal" // Importar el nuevo modal

interface FiltersFolderScreenProps {
  folder: Document | null
}

// Optimización 1: Screen optimizado para filtros de carpeta
const FiltersFolderScreen: React.FC<FiltersFolderScreenProps> = memo(({ folder }) => {
  const navigation = useNavigation<NavigationProp>()
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false)

  // Estado para el modal de acciones
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false)
  const [selectedDocumentForActions, setSelectedDocumentForActions] = useState<Document | null>(null)

  // Optimización 2: Usar hooks personalizados
  const { folderDocuments, loading, refetch } = useFolderDocuments(folder) // Obtener documentos de la carpeta
  const { search, setSearch, sortOrder, toggleSortOrder, filteredDocuments } = useDocumentFilters({
    documents: folderDocuments, // Pasar directamente los documentos de la carpeta
  })

  // Optimización 3: Funciones de navegación y UI
  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleToggleSearch = useCallback(() => {
    setIsSearching(!isSearching)
    if (isSearching) {
      setSearch("")
    }
  }, [isSearching, setSearch])

  const handleToggleView = useCallback(() => {
    setViewMode((prev) => (prev === "list" ? "grid" : "list"))
  }, [])

  const handleToggleProfile = useCallback(() => {
    setIsProfileModalVisible(!isProfileModalVisible)
  }, [isProfileModalVisible])

  // Optimización 4: Manejar la acción de un item (abrir modal de acciones)
  const handleItemActionPress = useCallback((document: Document) => {
    setSelectedDocumentForActions(document)
    setIsActionMenuVisible(true)
  }, [])

  const handleActionMenuClose = useCallback(() => {
    setIsActionMenuVisible(false)
    setSelectedDocumentForActions(null)
  }, [])

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

      <DocumentList
        documents={filteredDocuments}
        onRefresh={refetch}
        renderMode={viewMode}
        folder={folder}
        emptyMessage="No hay documentos en esta carpeta."
        onItemActionPress={handleItemActionPress} // Pasar la función para abrir el modal de acciones
      />

      <ProfileModal visible={isProfileModalVisible} onClose={handleToggleProfile} />

      {/* Modal de acciones del documento */}
      <ActionMenuModal
        visible={isActionMenuVisible}
        onClose={handleActionMenuClose}
        document={selectedDocumentForActions}
        onActionComplete={handleActionMenuClose} // Cerrar el modal después de cualquier acción
      />
    </View>
  )
})

FiltersFolderScreen.displayName = "FiltersFolderScreen"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
})

export default FiltersFolderScreen
