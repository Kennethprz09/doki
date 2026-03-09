// NewActionComponent.tsx
import React from "react";
import { memo, useState, useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useDocumentScanner } from "../../hooks/useDocumentScanner";
import { useFolderManager } from "../../hooks/useFolderManager";
import NewActionButton from "./NewActionButton";
import type { Document } from "../types";
import ActionOptionsModal from "../modals/ActionOptionsModal";
import CameraModal from "../modals/CameraModal";
import PhotoPreviewModal from "../modals/PhotoPreviewModal";
import CreateFolderModal from "../modals/CreateFolderModal";
import ConfirmDialog from "../common/ConfirmDialog";

interface NewActionComponentProps {
  folder?: { folder?: Partial<Document> };
}

const NewActionComponent: React.FC<NewActionComponentProps> = memo(
  ({ folder }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showBackPhotoConfirm, setShowBackPhotoConfirm] = useState(false);
    const pendingPhotoUri = useRef<string>("");

    const { uploadFile, uploading } = useFileUpload({
      folderId: folder?.folder?.id,
    });

    const {
      scanState,
      scanning,
      setFrontPhoto,
      setBackPhoto,
      setIsCapturingBack,
      resetScanState,
      requestCameraPermission,
      generatePDF,
    } = useDocumentScanner({
      folderId: folder?.folder?.id,
    });

    const { createFolder, processing } = useFolderManager();

    const handlePhotoCapture = useCallback(
      (photoUri: string) => {
        if (scanState.isCapturingBack) {
          setBackPhoto(photoUri);
          setShowCamera(false);
          setTimeout(() => {
            setShowPreview(true);
          }, 500);
        } else {
          setFrontPhoto(photoUri);
          pendingPhotoUri.current = photoUri;
          setShowCamera(false);
          setTimeout(() => {
            setShowBackPhotoConfirm(true);
          }, 500);
        }
      },
      [
        scanState.isCapturingBack,
        setFrontPhoto,
        setBackPhoto,
        setIsCapturingBack,
      ]
    );

    const handleBackPhotoNo = useCallback(() => {
      setShowBackPhotoConfirm(false);
      setTimeout(() => {
        setShowPreview(true);
      }, 300);
    }, []);

    const handleBackPhotoYes = useCallback(() => {
      setShowBackPhotoConfirm(false);
      setIsCapturingBack(true);
      setTimeout(() => {
        setShowCamera(true);
      }, 300);
    }, [setIsCapturingBack]);

    const handleRetakeFront = useCallback(() => {
      setFrontPhoto("");
      setIsCapturingBack(false);
      setShowPreview(false);
      setTimeout(() => {
        setShowCamera(true);
      }, 500); // Retraso para cerrar PhotoPreviewModal
    }, [setFrontPhoto, setIsCapturingBack]);

    const handleRetakeBack = useCallback(() => {
      setBackPhoto("");
      setIsCapturingBack(true);
      setShowPreview(false);
      setTimeout(() => {
        setShowCamera(true);
      }, 500); // Retraso para cerrar PhotoPreviewModal
    }, [setBackPhoto, setIsCapturingBack]);

    const handleStartScan = useCallback(async () => {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return;
      }

      resetScanState();
      setShowCamera(true);
    }, [requestCameraPermission, resetScanState]);

    const handleSavePDF = useCallback(async () => {
      const success = await generatePDF();
      if (success) {
        setShowPreview(false);
        resetScanState();
      } else {
      }
      return success;
    }, [generatePDF, resetScanState]);

    const handleCreateFolder = useCallback(
      async (name: string) => {
        const success = await createFolder(name);
        if (success) {
          setShowCreateFolder(false);
        } else {
        }
        return success;
      },
      [createFolder]
    );

    const handleOptionSelect = useCallback(
      (optionId: string) => {
        setShowOptions(false);
        setTimeout(() => {
          if (optionId === "folder") {
            setShowCreateFolder(true);
          } else if (optionId === "file") {
            uploadFile();
          } else if (optionId === "scan") {
            handleStartScan();
          }
        }, 500); // Retraso de 500ms para todas las opciones
      },
      [uploadFile, handleStartScan]
    );

    const actionOptions = [
      ...(folder?.folder?.id
        ? []
        : [
            {
              id: "folder",
              label: "Carpeta",
              icon: "folder-outline" as const,
              onPress: () => handleOptionSelect("folder"),
            },
          ]),
      {
        id: "file",
        label: "Archivo",
        icon: "cloud-upload-outline" as const,
        onPress: () => handleOptionSelect("file"),
      },
      {
        id: "scan",
        label: "Escanear",
        icon: "scan-outline" as const,
        onPress: () => handleOptionSelect("scan"),
      },
    ];

    const isDisabled = uploading || scanning || processing;

    return (
      <View style={styles.container} pointerEvents="box-none">
        <NewActionButton
          onPress={() => {
            setShowOptions(true);
          }}
          disabled={isDisabled}
        />

        <ActionOptionsModal
          visible={showOptions}
          onClose={() => {
            setShowOptions(false);
          }}
          options={actionOptions}
        />

        <CameraModal
          visible={showCamera}
          onClose={() => {
            setShowCamera(false);
            resetScanState();
          }}
          onCapture={handlePhotoCapture}
        />

        <PhotoPreviewModal
          visible={showPreview}
          onClose={() => {
            setShowPreview(false);
            resetScanState();
          }}
          frontPhoto={scanState.frontPhoto}
          backPhoto={scanState.backPhoto}
          onRetakeFront={handleRetakeFront}
          onRetakeBack={handleRetakeBack}
          onSave={handleSavePDF}
          onUpdateFrontPhoto={setFrontPhoto}
          onUpdateBackPhoto={setBackPhoto}
        />

        <CreateFolderModal
          visible={showCreateFolder}
          onClose={() => {
            setShowCreateFolder(false);
          }}
          onSubmit={handleCreateFolder}
          loading={processing}
        />

        <ConfirmDialog
          visible={showBackPhotoConfirm}
          onClose={() => setShowBackPhotoConfirm(false)}
          onCancel={handleBackPhotoNo}
          onConfirm={handleBackPhotoYes}
          title="¿Tomar foto trasera?"
          message="¿Deseas tomar una foto de la parte trasera del documento?"
          confirmText="Sí"
          cancelText="No"
        />
      </View>
    );
  }
);

NewActionComponent.displayName = "NewActionComponent";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    pointerEvents: "box-none",
  },
});

export default NewActionComponent;
