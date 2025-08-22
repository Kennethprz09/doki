// NewActionComponent.tsx
import React from 'react';
import { memo, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useDocumentScanner } from '../../hooks/useDocumentScanner';
import { useFolderManager } from '../../hooks/useFolderManager';
import NewActionButton from './NewActionButton';
import type { Document } from '../types';
import ActionOptionsModal from '../modals/ActionOptionsModal';
import CameraModal from '../modals/CameraModal';
import PhotoPreviewModal from '../modals/PhotoPreviewModal';
import CreateFolderModal from '../modals/CreateFolderModal';

interface NewActionComponentProps {
  folder?: { folder?: Partial<Document> };
}

const NewActionComponent: React.FC<NewActionComponentProps> = memo(
  ({ folder }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);

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
        console.log('Photo captured:', photoUri);
        if (scanState.isCapturingBack) {
          console.log('Setting back photo and opening PhotoPreviewModal');
          setBackPhoto(photoUri);
          setShowCamera(false);
          setTimeout(() => {
            console.log('Opening PhotoPreviewModal');
            setShowPreview(true);
          }, 500); // Retraso para cerrar CameraModal
        } else {
          console.log('Setting front photo');
          setFrontPhoto(photoUri);
          Alert.alert(
            '¿Tomar foto trasera?',
            '¿Deseas tomar una foto de la parte trasera del documento?',
            [
              {
                text: 'No',
                onPress: () => {
                  console.log('No back photo, opening PhotoPreviewModal');
                  setShowCamera(false);
                  setTimeout(() => {
                    console.log('Opening PhotoPreviewModal');
                    setShowPreview(true);
                  }, 500); // Retraso para cerrar CameraModal
                },
              },
              {
                text: 'Sí',
                onPress: () => {
                  console.log('Capturing back photo');
                  setIsCapturingBack(true);
                },
              },
            ]
          );
        }
      },
      [
        scanState.isCapturingBack,
        setFrontPhoto,
        setBackPhoto,
        setIsCapturingBack,
      ]
    );

    const handleRetakeFront = useCallback(() => {
      console.log('Retaking front photo');
      setFrontPhoto('');
      setIsCapturingBack(false);
      setShowPreview(false);
      setTimeout(() => {
        console.log('Opening CameraModal for front photo');
        setShowCamera(true);
      }, 500); // Retraso para cerrar PhotoPreviewModal
    }, [setFrontPhoto, setIsCapturingBack]);

    const handleRetakeBack = useCallback(() => {
      console.log('Retaking back photo');
      setBackPhoto('');
      setIsCapturingBack(true);
      setShowPreview(false);
      setTimeout(() => {
        console.log('Opening CameraModal for back photo');
        setShowCamera(true);
      }, 500); // Retraso para cerrar PhotoPreviewModal
    }, [setBackPhoto, setIsCapturingBack]);

    const handleStartScan = useCallback(async () => {
      console.log('Starting scan process');
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        console.log('Camera permission denied');
        return;
      }

      console.log('Resetting scan state and opening CameraModal');
      resetScanState();
      setShowCamera(true);
    }, [requestCameraPermission, resetScanState]);

    const handleSavePDF = useCallback(async () => {
      console.log('Starting PDF save');
      const success = await generatePDF();
      if (success) {
        console.log('PDF saved successfully, closing PhotoPreviewModal');
        setShowPreview(false);
        resetScanState();
      } else {
        console.log('PDF save failed');
      }
      console.log('PDF save process completed');
      return success;
    }, [generatePDF, resetScanState]);

    const handleCreateFolder = useCallback(
      async (name: string) => {
        console.log('Submitting folder creation with name:', name);
        const success = await createFolder(name);
        if (success) {
          console.log('Folder creation successful, closing CreateFolderModal');
          setShowCreateFolder(false);
        } else {
          console.log('Folder creation failed');
        }
        return success;
      },
      [createFolder]
    );

    const handleOptionSelect = useCallback(
      (optionId: string) => {
        console.log('Selected option:', optionId);
        setShowOptions(false);
        setTimeout(() => {
          if (optionId === 'folder') {
            console.log('Opening CreateFolderModal');
            setShowCreateFolder(true);
          } else if (optionId === 'file') {
            console.log('Starting file upload');
            uploadFile();
          } else if (optionId === 'scan') {
            console.log('Starting scan');
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
              id: 'folder',
              label: 'Carpeta',
              icon: 'folder-outline' as const,
              onPress: () => handleOptionSelect('folder'),
            },
          ]),
      {
        id: 'file',
        label: 'Archivo',
        icon: 'cloud-upload-outline' as const,
        onPress: () => handleOptionSelect('file'),
      },
      {
        id: 'scan',
        label: 'Escanear',
        icon: 'scan-outline' as const,
        onPress: () => handleOptionSelect('scan'),
      },
    ];

    const isDisabled = uploading || scanning || processing;

    return (
      <View style={styles.container}>
        <NewActionButton
          onPress={() => {
            console.log('Opening ActionOptionsModal');
            setShowOptions(true);
          }}
          disabled={isDisabled}
        />

        <ActionOptionsModal
          visible={showOptions}
          onClose={() => {
            console.log('Closing ActionOptionsModal');
            setShowOptions(false);
          }}
          options={actionOptions}
        />

        <CameraModal
          visible={showCamera}
          onClose={() => {
            console.log('Closing CameraModal');
            setShowCamera(false);
            resetScanState();
          }}
          onCapture={handlePhotoCapture}
        />

        <PhotoPreviewModal
          visible={showPreview}
          onClose={() => {
            console.log('Closing PhotoPreviewModal');
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
            console.log('Closing CreateFolderModal');
            setShowCreateFolder(false);
          }}
          onSubmit={handleCreateFolder}
          loading={processing}
        />
      </View>
    );
  }
);

NewActionComponent.displayName = 'NewActionComponent';

const styles = StyleSheet.create({
  container: {
    flex: 0.17,
    backgroundColor: 'transparent',
  },
});

export default NewActionComponent;
