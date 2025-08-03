"use client"

import type React from "react"
import { memo, useState, useCallback } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { useUserStore } from "../store/userStore"
import { useDocumentsStore } from "../store/documentsStore" // Importar useDocumentsStore
import { useDocumentFilters } from "../hooks/useDocumentFilters"
import FilterControls from "../components/common/FilterControls"
import DocumentList from "../components/common/DocumentList"
import ProfileModal from "../components/modals/ProfileModal"
import ActionMenuModal from "../components/modals/ActionMenuModal" // Importar el nuevo modal
import type { Document } from "../components/types"
import useDocumentsSync from "../hooks/useDocumentsSync"

interface FiltersScreenProps {
  filterType: "all" | "favorites"
}

// Optimización 1: Screen optimizado para filtros principales
const FiltersScreen: React.FC<FiltersScreenProps> = memo(({ filterType }) => {
  const user = useUserStore((state) => state.user)
  const documents = useDocumentsStore((state) => state.documents) // Obtener documentos raíz
  const documentsFavorite = useDocumentsStore((state) => state.documentsFavorite) // Obtener documentos favoritos
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false)

  // Estado para el modal de acciones
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false)
  const [selectedDocumentForActions, setSelectedDocumentForActions] = useState<Document | null>(null)

  // Hook para sincronización de documentos
  const { syncDocuments } = useDocumentsSync()

  // Optimización 2: Seleccionar documentos según el tipo de filtro
  const sourceDocuments = filterType === "all" ? documents : documentsFavorite

  // Optimización 3: Usar hook de filtros
  const { search, setSearch, sortOrder, toggleSortOrder, filteredDocuments } = useDocumentFilters({
    documents: sourceDocuments, // Pasar los documentos ya filtrados por tipo
  })

  // Optimización 4: Funciones de UI
  const handleToggleView = useCallback(() => {
    setViewMode((prev) => (prev === "list" ? "grid" : "list"))
  }, [])

  const handleToggleProfile = useCallback(() => {
    setIsProfileModalVisible(!isProfileModalVisible)
  }, [isProfileModalVisible])

  // Optimización 5: Manejar la acción de un item (abrir modal de acciones)
  const handleItemActionPress = useCallback((document: Document) => {
    setSelectedDocumentForActions(document)
    setIsActionMenuVisible(true)
  }, [])

  const handleActionMenuClose = useCallback(() => {
    setIsActionMenuVisible(false)
    setSelectedDocumentForActions(null)
  }, [])

  // Optimización 6: Generar iniciales del usuario
  const userInitials = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  // Función de recarga para DocumentList
  const handleRefresh = useCallback(async () => {
    await syncDocuments() // Llama a la función de sincronización global
  }, [syncDocuments])

  return (
    <View style={styles.container}>
      {/* Header con búsqueda y avatar */}
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

      {/* Controles de filtro */}
      <FilterControls
        sortDirection={sortOrder.direction}
        onToggleSort={toggleSortOrder}
        viewMode={viewMode}
        onToggleView={handleToggleView}
      />

      {/* Lista de documentos */}
      <DocumentList
        documents={filteredDocuments}
        onRefresh={handleRefresh} // Siempre pasar la función de recarga
        renderMode={viewMode}
        emptyMessage={
          filterType === "all" ? "No hay documentos disponibles." : "No tienes documentos marcados como favoritos."
        }
        onItemActionPress={handleItemActionPress} // Pasar la función para abrir el modal de acciones
      />

      {/* Modal de perfil */}
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

FiltersScreen.displayName = "FiltersScreen"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
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
