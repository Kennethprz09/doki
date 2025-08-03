"use client";
import type React from "react";
import { memo, useCallback, useState } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import type { Document, NavigationProp } from "../types";

const { width } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (width - 48) / 2;

interface DocumentItemProps {
  document: Document;
  onPress: (document: Document) => void;
  onLongPress: (document: Document) => void;
  isSelected: boolean;
  showActions: boolean;
  renderMode: "list" | "grid";
  onActionPress?: (document: Document) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = memo(
  ({
    document,
    onPress,
    onLongPress,
    isSelected,
    showActions,
    renderMode,
    onActionPress,
  }) => {
    const navigation = useNavigation<NavigationProp>();
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [onSelectionChange, setOnSelectionChange] =
      useState<(selectedItems: number[]) => void | undefined>(undefined);

    // Optimización 2: Función de press optimizada
    const handlePress = useCallback(() => {
      if (document.is_folder && showActions) {
        navigation.navigate("OpenFolderPage", { item: document });
      } else {
        if (!document.is_folder) {
          onPress(document);
        }
      }
    }, [document, showActions, navigation, onPress]);

    const handleLongPress = useCallback(() => {
      if (!document.is_folder) {
        const newSelection = selectedItems.includes(document.id)
          ? selectedItems
          : [...selectedItems, document.id];
        setSelectedItems(newSelection);
        onSelectionChange?.(newSelection);
        onLongPress(document);
      }
    }, [selectedItems, onLongPress, onSelectionChange, document]);

    const handleActionPress = useCallback(() => {
      onActionPress?.(document);
    }, [onActionPress, document]);

    const formattedDate: string | null = null;
    let documentName: string = "";
    let documentColor: string = "";
    let documentIcon: string = "";

    const safeText = (value: any, fallback: string = "Sin nombre"): string => {
      if (value === null || value === undefined) {
        return fallback;
      }
      if (typeof value === "object") {
        return fallback;
      }
      const stringValue = String(value).trim();
      if (
        stringValue === "" ||
        stringValue === "null" ||
        stringValue === "undefined"
      ) {
        return fallback;
      }
      return stringValue;
    };

    documentName = safeText(document.name);
    documentColor =
      document.color && typeof document.color === "string"
        ? document.color
        : "#ff8c00";
    documentIcon =
      document.icon && typeof document.icon === "string"
        ? document.icon
        : "document-outline";

    const itemStyle = [
      renderMode === "grid" ? styles.gridItem : styles.listItem,
      isSelected && styles.selectedItem,
    ];
    const iconName = isSelected ? "checkmark-circle-outline" : documentIcon;
    const iconColor = isSelected ? "#ff8c00" : documentColor;

    const accessibilityLabel = `${
      document.is_folder ? "Carpeta" : "Documento"
    }: ${documentName}`;

    if (renderMode === "grid") {
      return (
        <TouchableOpacity
          style={itemStyle}
          onPress={handlePress}
          onLongPress={handleLongPress}
          accessibilityLabel={accessibilityLabel}
        >
          <View style={styles.gridContentWrapper}>
            <View
              style={[
                styles.gridIconContainer,
                { backgroundColor: documentColor },
              ]}
            >
              <Ionicons name={iconName as any} size={40} color="#FFF" />
            </View>
            <Text
              style={styles.gridFileName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {documentName}
            </Text>
            {document.updated_at && (
              <Text style={styles.gridFileDetails}>
                {`Modificado ${format(
                  new Date(document.updated_at),
                  "dd MMM yyyy"
                )}`}
              </Text>
            )}
            {showActions && (
              <TouchableOpacity
                style={styles.gridMoreIcon}
                onPress={handleActionPress}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={itemStyle}
        onPress={handlePress}
        onLongPress={handleLongPress}
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name={iconName as any} size={30} color={iconColor} />
        <View style={styles.listFileInfo}>
          <Text
            style={styles.listFileName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {documentName}
          </Text>
          {document.updated_at && (
            <Text style={styles.listFileDetails}>
              {`Modificado ${format(
                new Date(document.updated_at),
                "dd MMM yyyy"
              )}`}
            </Text>
          )}
        </View>
        {showActions && (
          <TouchableOpacity onPress={handleActionPress}>
            <Ionicons name="ellipsis-vertical" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }
);

DocumentItem.displayName = "DocumentItem";

const styles = StyleSheet.create({
  gridItem: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    position: "relative",
    alignItems: "center",
    minHeight: 150,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginVertical: 8,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  gridContentWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  gridIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridFileName: {
    fontSize: 15,
    fontFamily: "Karla-Bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 4,
    paddingHorizontal: 5,
  },
  gridFileDetails: {
    fontSize: 12,
    fontFamily: "Karla-Regular",
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 5,
  },
  gridMoreIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: 4,
  },
  listFileInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  listFileName: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#333",
    marginBottom: 2,
  },
  listFileDetails: {
    fontSize: 14,
    fontFamily: "Karla-Regular",
    color: "#888",
  },
  selectedItem: {
    backgroundColor: "#fff3e0",
    borderColor: "#ff8c00",
    borderWidth: 2,
  },
});

export default DocumentItem;
