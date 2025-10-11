// useDocumentScanner.ts
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from "expo-print";
import { Buffer } from "buffer";
import { Camera } from "expo-camera";
import { useUserStore } from "../store/userStore";
import { useDocumentsStore } from "../store/documentsStore";
import { useGlobalStore } from "../store/globalStore";
import { checkInternetConnection } from "../utils/actions";
import { supabase } from "../supabase/supabaseClient";
import type { Document } from "../components/types";

interface UseDocumentScannerProps {
  folderId?: string | null;
  onSuccess?: (document: Document) => void;
  onError?: (error: string) => void;
}

interface ScanState {
  frontPhoto: string | null;
  backPhoto: string | null;
  isCapturingBack: boolean;
}

export const useDocumentScanner = ({ folderId, onSuccess, onError }: UseDocumentScannerProps = {}) => {
  const user = useUserStore((state) => state.user);
  const { addDocument } = useDocumentsStore();
  const { setLoading } = useGlobalStore();
  const [scanning, setScanning] = useState(false);
  const [scanState, setScanState] = useState<ScanState>({
    frontPhoto: null,
    backPhoto: null,
    isCapturingBack: false,
  });

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB por imagen

  const requestCameraPermission = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== "granted") {
        console.error("Camera permission denied");
        Alert.alert("Permiso denegado", "Se necesita acceso a la cámara para escanear documentos.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      return false;
    }
  }, []);

  const setFrontPhoto = useCallback((uri: string) => {
    setScanState((prev) => ({ ...prev, frontPhoto: uri }));
  }, []);

  const setBackPhoto = useCallback((uri: string) => {
    setScanState((prev) => ({ ...prev, backPhoto: uri }));
  }, []);

  const setIsCapturingBack = useCallback((capturing: boolean) => {
    setScanState((prev) => ({ ...prev, isCapturingBack: capturing }));
  }, []);

  const resetScanState = useCallback(() => {
    setScanState({
      frontPhoto: null,
      backPhoto: null,
      isCapturingBack: false,
    });
  }, []);

  const generatePDF = useCallback(async () => {
    if (!scanState.frontPhoto) {
      const errorMsg = "La foto frontal es obligatoria";
      console.error(errorMsg);
      onError?.(errorMsg);
      Alert.alert("Error", errorMsg);
      return false;
    }

    try {
      const isOffline = await checkInternetConnection();
      if (isOffline) {
        const errorMsg = "No hay conexión a internet";
        console.error(errorMsg);
        onError?.(errorMsg);
        Toast.show({
          type: "error",
          text1: "Sin conexión",
          text2: "Por favor, verifica tu conexión a internet.",
        });
        return false;
      }

      if (!user?.id) {
        const errorMsg = "Usuario no autenticado";
        console.error(errorMsg);
        onError?.(errorMsg);
        Alert.alert("Error", errorMsg);
        return false;
      }

      setScanning(true);
      setLoading(true);

      // Validar tamaño de las imágenes
      const frontInfo = await FileSystem.getInfoAsync(scanState.frontPhoto);
      if (!frontInfo.exists || frontInfo.size > MAX_IMAGE_SIZE) {
        const errorMsg = "La foto frontal es inválida o excede el límite de 5MB";
        console.error(errorMsg);
        onError?.(errorMsg);
        Alert.alert("Error", errorMsg);
        return false;
      }

      let backPhotoBase64 = null;
      if (scanState.backPhoto) {
        const backInfo = await FileSystem.getInfoAsync(scanState.backPhoto);
        if (!backInfo.exists || backInfo.size > MAX_IMAGE_SIZE) {
          Regul
          const errorMsg = "La foto trasera es inválida o excede el límite de 5MB";
          console.error(errorMsg);
          onError?.(errorMsg);
          Alert.alert("Error", errorMsg);
          return false;
        }
        backPhotoBase64 = await FileSystem.readAsStringAsync(scanState.backPhoto, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Usar fetch para obtener Blob en lugar de Base64
      const frontResponse = await fetch(scanState.frontPhoto);
      const frontBlob = await frontResponse.blob();

      let backBlob = null;
      if (scanState.backPhoto) {
        const backResponse = await fetch(scanState.backPhoto);
        backBlob = await backResponse.blob();
      }

      // Crear HTML con imágenes incrustadas
      const htmlContent = `
        <html>
          <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="text-align: center; color: #333;">Documento Escaneado</h1>
            <div style="text-align: center; margin: 20px 0;">
              <img src="${scanState.frontPhoto}" 
                   style="width: 100%; max-width: 500px; margin-bottom: 20px; border: 1px solid #ddd;" />
              ${
                scanState.backPhoto
                  ? `<img src="${scanState.backPhoto}" 
                         style="width: 100%; max-width: 500px; border: 1px solid #ddd;" />`
                  : ""
              }
            </div>
            <p style="text-align: center; color: #666; font-size: 12px;">
              Generado el ${new Date().toLocaleDateString()}
            </p>
          </body>
        </html>
      `;

      const { uri, base64 } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true,
      });

      const fileContent = base64 || (await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      }));

      const fileName = `scanned_${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;
      const fileData = Buffer.from(fileContent, "base64");

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, fileData, {
        contentType: "application/pdf",
      });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }


      const { data, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            name: fileName,
            size: fileContent.length,
            ext: "application/pdf",
            user_id: user.id,
            folder_id: folderId || null,
            is_folder: false,
            path: filePath,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }


      const newDocument: Document = {
        id: data.id,
        name: data.name,
        folder_id: data.folder_id,
        is_favorite: false,
        is_folder: data.is_folder,
        path: data.path,
        size: data.size,
        ext: data.ext,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      addDocument(newDocument);
      onSuccess?.(newDocument);

      Toast.show({
        type: "success",
        text1: "Documento escaneado",
        text2: "El documento se ha guardado como PDF",
      });

      resetScanState();
      return true;
    } catch (error: any) {
      const errorMsg = error.message || "No se pudo generar el PDF";
      console.error("Error generating PDF:", error);
      onError?.(errorMsg);
      Alert.alert("Error", errorMsg);
      return false;
    } finally {
      setScanning(false);
      setLoading(false);
    }
  }, [scanState, user?.id, folderId, addDocument, setLoading, onSuccess, onError, resetScanState]);

  return {
    scanState,
    scanning,
    setFrontPhoto,
    setBackPhoto,
    setIsCapturingBack,
    resetScanState,
    requestCameraPermission,
    generatePDF,
  };
};