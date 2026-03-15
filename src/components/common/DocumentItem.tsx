import React from "react";
import { memo, useCallback } from "react";
import { TouchableOpacity, Text, View, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigation } from "@react-navigation/native";
import type { Document, NavigationProp } from "../types";
import { colors, fonts, radii, shadows, withAlpha } from "../../theme";

const { width } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (width - 16 * 2 - 12) / 2;

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
  ({ document, onPress, onLongPress, isSelected, showActions, renderMode, onActionPress }) => {
    const navigation = useNavigation<NavigationProp>();

    const handlePress = useCallback(() => {
      if (document.is_folder && showActions) {
        navigation.navigate("OpenFolderPage", { item: document });
      } else if (!document.is_folder) {
        onPress(document);
      }
    }, [document, showActions, navigation, onPress]);

    const handleLongPress = useCallback(() => {
      if (!document.is_folder) onLongPress(document);
    }, [onLongPress, document]);

    const handleActionPress = useCallback(() => {
      onActionPress?.(document);
    }, [onActionPress, document]);

    const safeText = (value: any, fallback = "Sin nombre"): string => {
      if (value === null || value === undefined || typeof value === "object") return fallback;
      const s = String(value).trim();
      return s === "" || s === "null" || s === "undefined" ? fallback : s;
    };

    const documentName = safeText(document.name);
    const documentColor =
      document.color && typeof document.color === "string" ? document.color : colors.gray400;
    const documentIcon =
      document.icon && typeof document.icon === "string" ? document.icon : "document-outline";

    const iconName = isSelected ? "checkmark-circle" : documentIcon;
    const iconColor = isSelected ? colors.primary : documentColor;
    const iconBg = isSelected ? colors.primarySubtle : withAlpha(documentColor, 14);

    const formattedDate = document.updated_at
      ? format(new Date(document.updated_at), "d MMM yyyy", { locale: es })
      : null;

    if (renderMode === "grid") {
      return (
        <TouchableOpacity
          style={[styles.gridItem, isSelected && styles.selectedGrid]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          accessibilityLabel={`${document.is_folder ? "Carpeta" : "Documento"}: ${documentName}`}
          activeOpacity={0.75}
        >
          {/* Action button */}
          {showActions && (
            <TouchableOpacity
              style={styles.gridAction}
              onPress={handleActionPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={colors.gray400} />
            </TouchableOpacity>
          )}

          {/* Icon */}
          <View style={[styles.gridIconContainer, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName as any} size={32} color={iconColor} />
          </View>

          {/* Name */}
          <Text style={styles.gridName} numberOfLines={2} ellipsizeMode="tail">
            {documentName}
          </Text>
        </TouchableOpacity>
      );
    }

    // ─── List mode ───────────────────────────────────────────────────────────
    return (
      <TouchableOpacity
        style={[styles.listItem, isSelected && styles.selectedList]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        accessibilityLabel={`${document.is_folder ? "Carpeta" : "Documento"}: ${documentName}`}
        activeOpacity={0.75}
      >
        {/* Left accent bar */}
        <View style={[styles.listAccent, { backgroundColor: documentColor }]} />

        {/* Icon container */}
        <View style={[styles.listIconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName as any} size={22} color={iconColor} />
        </View>

        {/* Text content */}
        <View style={styles.listContent}>
          <Text style={styles.listName} numberOfLines={1} ellipsizeMode="tail">
            {documentName}
          </Text>
        </View>

        {/* Action button */}
        {showActions && (
          <TouchableOpacity
            onPress={handleActionPress}
            style={styles.listAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }
);

DocumentItem.displayName = "DocumentItem";

const styles = StyleSheet.create({
  // ── List ──────────────────────────────────────────────────────────────────
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
    ...shadows.sm,
  },
  selectedList: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  listAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  listIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    marginVertical: 12,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    marginVertical: 14,
    justifyContent: "center",
  },
  listName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.gray900,
    marginBottom: 4,
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listDate: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray400,
  },
  listAction: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  gridItem: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    minHeight: 160,
    borderWidth: 1.5,
    borderColor: "transparent",
    ...shadows.md,
  },
  selectedGrid: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  gridIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.gray900,
    textAlign: "center",
    marginBottom: 4,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  gridDate: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.gray400,
    textAlign: "center",
  },
  gridAction: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 4,
  },
});

export default DocumentItem;
