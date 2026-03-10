// ActionMenuModal.tsx
import React from "react";
import { memo, useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BaseModal from "../common/BaseModal";
import ActionMoveModal from "./ActionMoveModal";
import ConfirmDialog from "../common/ConfirmDialog";
import { useDocumentActions } from "../../hooks/useDocumentActions";
import { useFileOperations } from "../../hooks/useFileOperations";
import type { Document, ModalProps } from "../types";
import { colors, fonts, spacing, radii, shadows, withAlpha } from "../../theme";

interface ActionMenuModalProps extends ModalProps {
  document: Document | null;
  onActionComplete: () => void;
  folder?: Document;
  onActionSelect: (action: "edit" | "color", document: Document) => void;
}

const ActionMenuModal: React.FC<ActionMenuModalProps> = memo(
  ({ visible, onClose, document, onActionComplete, folder, onActionSelect }) => {
    const insets = useSafeAreaInsets();
    const { toggleFavorite, deleteDocumentById } = useDocumentActions();
    const { viewFile, shareFile, downloadFile } = useFileOperations();
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleToggleFavorite = useCallback(async () => {
      if (!document) return;
      const success = await toggleFavorite(document.id, document.is_favorite);
      if (success) onActionComplete();
    }, [document, toggleFavorite, onActionComplete]);

    const handleViewFile = useCallback(async () => {
      if (!document) return;
      onClose();
      await viewFile(document.path, document.ext, document.name);
    }, [document, viewFile, onClose]);

    const handleShareFile = useCallback(async () => {
      if (!document) return;
      onClose();
      await shareFile(document.path, document.name);
    }, [document, shareFile, onClose]);

    const handleDownloadFile = useCallback(async () => {
      if (!document) return;
      onClose();
      await downloadFile(document.path, document.name, document.ext);
    }, [document, downloadFile, onClose]);

    const handleDelete = useCallback(() => {
      if (!document) return;
      setShowDeleteConfirm(true);
    }, [document]);

    const confirmDelete = useCallback(async () => {
      if (!document) return;
      const success = await deleteDocumentById(document.id);
      if (success) onActionComplete();
    }, [document, deleteDocumentById, onActionComplete]);

    const handleEdit = useCallback(() => {
      if (!document) return;
      onClose();
      onActionSelect("edit", document);
    }, [document, onClose, onActionSelect]);

    const handleChangeColor = useCallback(() => {
      if (!document) return;
      onClose();
      onActionSelect("color", document);
    }, [document, onClose, onActionSelect]);

    const handleMoveComplete = useCallback(() => {
      setShowMoveModal(false);
      onActionComplete();
    }, [onActionComplete]);

    if (!document) return null;

    const docColor =
      document.color && typeof document.color === "string" ? document.color : colors.gray400;
    const docIcon =
      document.icon && typeof document.icon === "string" ? document.icon : "document-outline";

    // ── Action groups ────────────────────────────────────────────────────────
    const primaryActions = [
      { key: "view", icon: "eye-outline", label: "Ver", onPress: handleViewFile, show: !document.is_folder },
      { key: "share", icon: "share-social-outline", label: "Compartir", onPress: handleShareFile, show: !document.is_folder },
      { key: "download", icon: "download-outline", label: "Descargar", onPress: handleDownloadFile, show: !document.is_folder },
    ].filter((a) => a.show);

    const secondaryActions = [
      { key: "favorite", icon: document.is_favorite ? "star" : "star-outline", label: document.is_favorite ? "Quitar favorito" : "Favorito", onPress: handleToggleFavorite, accent: document.is_favorite },
      { key: "edit", icon: "create-outline", label: "Renombrar", onPress: handleEdit, accent: false },
      { key: "color", icon: "color-palette-outline", label: "Color", onPress: handleChangeColor, accent: false },
    ];

    return (
      <>
        <BaseModal visible={visible} onClose={onClose} backdropOpacity={0.55} position="bottom">
          <View style={styles.sheet}>
            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Document info */}
            <View style={styles.docInfo}>
              <View style={[styles.docIconContainer, { backgroundColor: withAlpha(docColor, 14) }]}>
                <Ionicons name={docIcon as any} size={26} color={docColor} />
              </View>
              <View style={styles.docMeta}>
                <Text style={styles.docName} numberOfLines={1}>{document.name}</Text>
                <View style={styles.docBadgeRow}>
                  {document.is_folder && (
                    <View style={[styles.badge, { backgroundColor: withAlpha(docColor, 18) }]}>
                      <Text style={[styles.badgeText, { color: docColor }]}>Carpeta</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Primary actions (files only): row of icon+label */}
            {primaryActions.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.primaryRow}>
                  {primaryActions.map((action) => (
                    <TouchableOpacity key={action.key} style={styles.primaryAction} onPress={action.onPress} activeOpacity={0.7}>
                      <View style={styles.primaryIconContainer}>
                        <Ionicons name={action.icon as any} size={22} color={colors.gray700} />
                      </View>
                      <Text style={styles.primaryLabel}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Secondary actions: list rows */}
            <View style={styles.divider} />
            <View style={styles.secondaryList}>
              {secondaryActions.map((action) => (
                <TouchableOpacity key={action.key} style={styles.row} onPress={action.onPress} activeOpacity={0.7}>
                  <View style={[styles.rowIcon, action.accent && styles.rowIconAccent]}>
                    <Ionicons
                      name={action.icon as any}
                      size={20}
                      color={action.accent ? colors.primary : colors.gray600}
                    />
                  </View>
                  <Text style={[styles.rowLabel, action.accent && styles.rowLabelAccent]}>
                    {action.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Danger zone */}
            <View style={styles.divider} />
            <TouchableOpacity style={[styles.row, styles.deleteRow]} onPress={handleDelete} activeOpacity={0.7}>
              <View style={[styles.rowIcon, styles.rowIconDanger]}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </View>
              <Text style={styles.deleteLabel}>Eliminar</Text>
            </TouchableOpacity>

            <View style={{ height: Math.max(insets.bottom, spacing.xl) }} />
          </View>
        </BaseModal>

        <ActionMoveModal
          visible={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          selectedItems={document ? [document.id] : []}
          onMoveComplete={handleMoveComplete}
          folder={folder}
        />

        <ConfirmDialog
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Eliminar documento"
          message={`¿Estás seguro de que quieres eliminar "${document?.name}"?`}
          confirmText="Eliminar"
          variant="destructive"
          icon="trash-outline"
        />
      </>
    );
  }
);

ActionMenuModal.displayName = "ActionMenuModal";

const styles = StyleSheet.create({
  sheet: {
    width: "100%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: radii.full,
    alignSelf: "center",
    marginBottom: spacing.base,
  },
  // Doc info
  docInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
    gap: spacing.md,
  },
  docIconContainer: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  docMeta: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.gray900,
    marginBottom: 4,
  },
  docBadgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.lg,
  },
  // Primary actions row
  primaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  primaryAction: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  primaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.gray600,
  },
  // Secondary list rows
  secondaryList: {
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  rowIconAccent: {
    backgroundColor: colors.primarySubtle,
  },
  rowIconDanger: {
    backgroundColor: colors.errorBg,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.gray800,
  },
  rowLabelAccent: {
    color: colors.primary,
  },
  // Delete
  deleteRow: {
    marginTop: spacing.xs,
  },
  deleteLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.error,
  },
});

export default ActionMenuModal;
