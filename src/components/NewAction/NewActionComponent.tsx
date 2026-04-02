// NewActionComponent.tsx
import React from "react";
import { memo, useState, useCallback, useRef } from "react";
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

    const { uploadFile, pickFromGallery, uploading } = useFileUpload({
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

    // Ref para la acción pendiente después de cerrar un modal
    const pendingActionRef = useRef<string | null>(null);

    const handleStartScan = useCallback(async () => {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
      resetScanState();
      setShowCamera(true);
    }, [requestCameraPermission, resetScanState]);

    // Callback cuando ActionOptionsModal termina de cerrarse
    const handleOptionsModalHidden = useCallback(() => {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action === "folder") setShowCreateFolder(true);
      else if (action === "file") uploadFile();
      else if (action === "photos") pickFromGallery();
      else if (action === "scan") handleStartScan();
    }, [uploadFile, pickFromGallery, handleStartScan]);

    // Callback cuando CameraModal termina de cerrarse
    const handleCameraModalHidden = useCallback(() => {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action === "preview") setShowPreview(true);
      else if (action === "backConfirm") setShowBackPhotoConfirm(true);
    }, []);

    // Callback cuando PhotoPreviewModal termina de cerrarse
    const handlePreviewModalHidden = useCallback(() => {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action === "camera") setShowCamera(true);
    }, []);

    // Callback cuando ConfirmDialog (foto trasera) termina de cerrarse
    const handleBackConfirmModalHidden = useCallback(() => {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action === "preview") setShowPreview(true);
      else if (action === "camera") setShowCamera(true);
    }, []);

    const handlePhotoCapture = useCallback(
      (photoUri: string) => {
        if (scanState.isCapturingBack) {
          setBackPhoto(photoUri);
          pendingActionRef.current = "preview";
          setShowCamera(false);
        } else {
          setFrontPhoto(photoUri);
          pendingPhotoUri.current = photoUri;
          pendingActionRef.current = "backConfirm";
          setShowCamera(false);
        }
      },
      [scanState.isCapturingBack, setFrontPhoto, setBackPhoto]
    );

    const handleBackPhotoNo = useCallback(() => {
      pendingActionRef.current = "preview";
      setShowBackPhotoConfirm(false);
    }, []);

    const handleBackPhotoYes = useCallback(() => {
      setIsCapturingBack(true);
      pendingActionRef.current = "camera";
      setShowBackPhotoConfirm(false);
    }, [setIsCapturingBack]);

    const handleRetakeFront = useCallback(() => {
      setFrontPhoto("");
      setIsCapturingBack(false);
      pendingActionRef.current = "camera";
      setShowPreview(false);
    }, [setFrontPhoto, setIsCapturingBack]);

    const handleRetakeBack = useCallback(() => {
      setBackPhoto("");
      setIsCapturingBack(true);
      pendingActionRef.current = "camera";
      setShowPreview(false);
    }, [setBackPhoto, setIsCapturingBack]);

    const handleSavePDF = useCallback(async () => {
      const success = await generatePDF();
      if (success) {
        setShowPreview(false);
        resetScanState();
      }
      return success;
    }, [generatePDF, resetScanState]);

    const handleCreateFolder = useCallback(
      async (name: string) => {
        const success = await createFolder(name);
        if (success) setShowCreateFolder(false);
        return success;
      },
      [createFolder]
    );

    const handleOptionSelect = useCallback(
      (optionId: string) => {
        pendingActionRef.current = optionId;
        setShowOptions(false);
      },
      []
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
        id: "photos",
        label: "Fotos",
        icon: "images-outline" as const,
        onPress: () => handleOptionSelect("photos"),
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
      <>
        <NewActionButton
          onPress={() => {
            setShowOptions(true);
          }}
          disabled={isDisabled}
        />

        <ActionOptionsModal
          visible={showOptions}
          onClose={() => setShowOptions(false)}
          options={actionOptions}
          onModalHidden={handleOptionsModalHidden}
        />

        <CameraModal
          visible={showCamera}
          onClose={() => {
            setShowCamera(false);
            resetScanState();
          }}
          onCapture={handlePhotoCapture}
          onModalHidden={handleCameraModalHidden}
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
          onModalHidden={handlePreviewModalHidden}
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
          onModalHidden={handleBackConfirmModalHidden}
        />
      </>
    );
  }
);

NewActionComponent.displayName = "NewActionComponent";


export default NewActionComponent;
