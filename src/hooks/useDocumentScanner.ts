// useDocumentScanner.ts
import { useCallback, useState } from "react";
import Toast from "react-native-toast-message";
import { File } from "expo-file-system";
import * as Print from "expo-print";
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

export const useDocumentScanner = ({
  folderId,
  onSuccess,
  onError,
}: UseDocumentScannerProps = {}) => {
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
        Toast.show({ type: "error", text1: "Permiso denegado", text2: "Se necesita acceso a la cámara para escanear documentos." });
        return false;
      }
      return true;
    } catch {
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
      onError?.(errorMsg);
      Toast.show({ type: "error", text1: "Error", text2: errorMsg });
      return false;
    }

    try {
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        const errorMsg = "No hay conexión a internet";
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
        onError?.(errorMsg);
        Toast.show({ type: "error", text1: "Error", text2: errorMsg });
        return false;
      }

      setScanning(true);
      setLoading(true);

      // Validar existencia y tamaño ANTES de leer base64
      const frontFile = new File(scanState.frontPhoto);
      const frontInfo = await frontFile.info();
      if (!frontInfo.exists || frontFile.size > MAX_IMAGE_SIZE) {
        const errorMsg = "La foto frontal es inválida o excede el límite de 5MB";
        onError?.(errorMsg);
        Toast.show({ type: "error", text1: "Error", text2: errorMsg });
        return false;
      }
      const frontPhotoBase64 = await frontFile.base64();

      let backPhotoBase64 = "";
      if (scanState.backPhoto) {
        const backFile = new File(scanState.backPhoto);
        const backInfo = await backFile.info();
        if (!backInfo.exists || backFile.size > MAX_IMAGE_SIZE) {
          const errorMsg = "La foto trasera es inválida o excede el límite de 5MB";
          onError?.(errorMsg);
          Toast.show({ type: "error", text1: "Error", text2: errorMsg });
          return false;
        }
        backPhotoBase64 = await backFile.base64();
      }

      // Crear HTML con imágenes incrustadas
      const htmlContent = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                line-height: 1.4;
                color: #333;
              }

              .page-container {
                max-width: 210mm; /* Ancho A4 */
                margin: 0 auto;
                padding: 15mm;
              }

              .header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
              }

              .image-container {
                text-align: center;
                margin: 25px 0;
              }

              .document-image {
                max-width: 100%;
                height: auto;
                max-height: 250mm; /* Altura máxima A4 */
                display: block;
                margin: 0 auto 20px auto;
                border: 1px solid #ddd;
                page-break-inside: avoid;
              }

              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 12px;
              }

              @media print {
                .page-break {
                  page-break-before: always;
                }
                
                body {
                  padding: 0;
                }
                
                .document-image {
                  max-height: 270mm; /* Mayor tolerancia para impresión */
                }
              }
            </style>
          </head>
          <body>
            <div class="page-container">
              <header class="header">
                <h1>Documento Escaneado</h1>
              </header>

              <div class="image-container">
                <img 
                  src="data:image/jpeg;base64,${frontPhotoBase64}" 
                  class="document-image"
                  alt="Frente del documento"
                />
                
                ${
                  scanState.backPhoto
                    ? `
                      <img 
                        src="data:image/jpeg;base64,${backPhotoBase64}" 
                        class="document-image"
                        alt="Dorso del documento"
                      />
                      `
                    : ""
                }
              </div>

              <footer class="footer">
                <p>Generado por Doki el ${new Date().toLocaleDateString()}</p>
              </footer>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true,
      });

      if (!uri) {
        throw new Error("No se pudo generar el archivo PDF");
      }

      const fileName = `scanned_${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;
      const fileInstance = new File(uri);
      const fileData = await fileInstance.bytes();

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, fileData, {
          contentType: "application/pdf",
        });

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            name: fileName,
            size: fileInstance.size,
            ext: "application/pdf",
            user_id: user.id,
            folder_id: folderId || null,
            is_folder: false,
            path: filePath,
          },
        ])
        .select()
        .single();

      if (insertError || !data) throw insertError || new Error("No se recibieron datos del servidor");

      const newDocument: Document = {
        id: data.id,
        name: data.name ?? fileName,
        folder_id: data.folder_id ?? null,
        is_favorite: data.is_favorite ?? false,
        is_folder: data.is_folder ?? false,
        path: data.path ?? filePath,
        size: data.size ?? 0,
        ext: data.ext ?? "application/pdf",
        user_id: data.user_id ?? user.id,
        created_at: data.created_at ?? new Date().toISOString(),
        updated_at: data.updated_at ?? new Date().toISOString(),
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
      onError?.(errorMsg);
      Toast.show({ type: "error", text1: "Error", text2: errorMsg });
      return false;
    } finally {
      setScanning(false);
      setLoading(false);
    }
  }, [
    scanState,
    user?.id,
    folderId,
    addDocument,
    setLoading,
    onSuccess,
    onError,
    resetScanState,
  ]);

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
