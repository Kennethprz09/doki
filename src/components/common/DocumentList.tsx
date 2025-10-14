"use client";

import React from "react";
import { memo, useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import type { Document } from "../types";
import DocumentItem from "./DocumentItem";
import SelectionBar from "./SelectionBar";
import { useFileOperations } from "../../hooks/useFileOperations";

const { height } = Dimensions.get("window");

interface DocumentListProps {
  documents: Document[];
  onRefresh?: () => Promise<void>;
  onDocumentPress?: (document: Document) => void;
  onDocumentLongPress?: (document: Document) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  renderMode?: "list" | "grid";
  folder?: Document;
  emptyMessage?: string;
  onItemActionPress?: (document: Document) => void; // Nueva prop para el menú de acciones
}

// Optimización 1: Lista de documentos reutilizable y optimizada
const DocumentList: React.FC<DocumentListProps> = memo(
  ({
    documents,
    onRefresh,
    onDocumentPress,
    onDocumentLongPress,
    onSelectionChange,
    renderMode = "list",
    folder,
    emptyMessage = "No hay documentos disponibles.",
    onItemActionPress, // Recibir la nueva prop
  }) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { viewFile } = useFileOperations();

    // Optimización 2: Función para manejar selección
    const handleItemPress = useCallback(
      async (document: Document) => {
        if (selectedItems.length > 0) {
          // Modo selección: alternar selección
          const newSelection = selectedItems.includes(document.id)
            ? selectedItems.filter((id) => id !== document.id)
            : [...selectedItems, document.id];

          setSelectedItems(newSelection);
          onSelectionChange?.(newSelection);
        } else {
          console.log(document, "que eres");
          // Modo normal: ejecutar acción
          // onDocumentPress?.(document)

          if (document.is_folder == false) {
            await viewFile(document.path, document.ext, document.name);
          }
        }
      },
      [selectedItems, onDocumentPress, onSelectionChange]
    );

    // Optimización 3: Función para manejar long press
    const handleItemLongPress = useCallback(
      (document: Document) => {
        if (!document.is_folder) {
          const newSelection = selectedItems.includes(document.id)
            ? selectedItems
            : [...selectedItems, document.id];

          setSelectedItems(newSelection);
          onSelectionChange?.(newSelection);
          onDocumentLongPress?.(document);
        }
      },
      [selectedItems, onDocumentLongPress, onSelectionChange]
    );

    // Optimización 4: Función para limpiar selección
    const handleClearSelection = useCallback(() => {
      setSelectedItems([]);
      onSelectionChange?.([]);
    }, [onSelectionChange]);

    // Optimización 5: Función de refresh optimizada
    const handleRefresh = useCallback(async () => {
      if (!onRefresh) return;

      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }, [onRefresh]);

    // Optimización 6: Render item optimizado
    const renderItem = useCallback(
      ({ item }: { item: Document }) => (
        <DocumentItem
          document={item}
          onPress={handleItemPress}
          onLongPress={handleItemLongPress}
          isSelected={selectedItems.includes(item.id)}
          showActions={selectedItems.length === 0}
          renderMode={renderMode}
          onActionPress={onItemActionPress} // Pasar la prop onItemActionPress
        />
      ),
      [
        handleItemPress,
        handleItemLongPress,
        selectedItems,
        renderMode,
        onItemActionPress,
      ]
    );

    // Optimización 7: Key extractor optimizado
    const keyExtractor = useCallback(
      (item: Document, index: number) => item.id || index.toString(),
      []
    );

    // Optimización 8: Empty component optimizado
    const EmptyComponent = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ),
      [emptyMessage]
    );

    return (
      <View style={styles.container}>
        {selectedItems.length > 0 && (
          <SelectionBar
            selectedCount={selectedItems.length}
            onClear={handleClearSelection}
            selectedItems={selectedItems}
            folder={folder}
            onActionComplete={handleClearSelection}
          />
        )}

        <FlatList
          data={documents}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            ) : undefined
          }
          numColumns={renderMode === "grid" ? 2 : 1}
          key={renderMode} // Force re-render when mode changes
          columnWrapperStyle={
            renderMode === "grid" ? styles.gridRow : undefined
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={EmptyComponent}
          initialNumToRender={10}
          windowSize={5}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={
            renderMode === "list"
              ? (data, index) => ({
                  length: 70,
                  offset: 70 * index,
                  index,
                })
              : undefined
          }
        />
      </View>
    );
  }
);

DocumentList.displayName = "DocumentList";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Karla-Regular",
    color: "#888",
  },
});

export default DocumentList;
