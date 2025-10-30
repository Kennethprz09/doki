// useFileUpload.ts
import { useCallback, useState } from "react";
import { Alert, DeviceEventEmitter } from "react-native";
import Toast from "react-native-toast-message";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useUserStore } from "../store/userStore";
import { useDocumentsStore } from "../store/documentsStore";
import { useGlobalStore } from "../store/globalStore";
import { checkInternetConnection } from "../utils/actions";
import { supabase } from "../supabase/supabaseClient";
import type { Document } from "../components/types";
import useDocumentsSync from "./useDocumentsSync";

interface UseFileUploadProps {
  folderId?: string | null;
  onSuccess?: (document: Document) => void;
  onError?: (error: string) => void;
}

export const useFileUpload = ({
  folderId,
  onSuccess,
  onError,
}: UseFileUploadProps = {}) => {
  const user = useUserStore((state) => state.user);
  const { addDocument } = useDocumentsStore();
  const { setLoading } = useGlobalStore();
  const { syncDocuments } = useDocumentsSync()

  
  const [uploading, setUploading] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  const uploadFile = useCallback(async () => {
    try {
      // Verificar conectividad
      const isOffline = await checkInternetConnection();
      if (isOffline) {
        const errorMsg = "No hay conexión a internet";
        onError?.(errorMsg);
        Toast.show({
          type: "error",
          text1: "Sin conexión",
          text2: "Por favor, verifica tu conexión a internet.",
        });
        return false;
      }

      // Verificar usuario
      if (!user?.id) {
        const errorMsg = "Usuario no autenticado";
        onError?.(errorMsg);
        Alert.alert("Error", errorMsg);
        return false;
      }

      setUploading(true);
      setLoading(true);

      // Seleccionar archivo
      const pickedFile = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_TYPES,
        copyToCacheDirectory: true,
      });

      if (pickedFile.canceled) {
        return false;
      }

      const file = pickedFile.assets[0];

      // Validar tamaño
      if (file.size && file.size > MAX_FILE_SIZE) {
        const errorMsg = "El archivo excede el límite de 10MB";
        onError?.(errorMsg);
        Alert.alert("Error", errorMsg);
        return false;
      }

      // Leer archivo y Subir a storage
      const fileInstance = new File(file.uri);
      const fileData = await fileInstance.bytes();

      const sanitizeFileName = (name: string) => {
        // Normaliza (separa caracteres compuestos) y elimina marcas diacríticas
        const normalized =
          name.normalize?.("NFKD")?.replace(/[\u0300-\u036f]/g, "") ?? name;
        // Reemplaza espacios por guiones bajos y elimina caracteres no seguros
        const replaced = normalized.replace(/\s+/g, "_");
        const safe = replaced.replace(/[^a-zA-Z0-9._-]/g, "");
        return safe || "file";
      };

      const safeFileName = sanitizeFileName(file.name);
      const filePath = `${user.id}/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, fileData, {
          contentType: file.mimeType || "application/octet-stream",
        });

      if (uploadError) {
        throw uploadError;
      }

      // Guardar en base de datos
      const { data, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            name: file.name,
            size: file.size || 0,
            ext: file.mimeType || "application/octet-stream",
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

      // Crear documento para el store
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

      if (!data.folder_id) {
        console.log("desde raiz");
        
        addDocument(newDocument);
      } else {
        console.log("desde carpeta");
        DeviceEventEmitter.emit("document:uploaded", { document: newDocument });
      }

      await syncDocuments();
      onSuccess?.(newDocument);

      Toast.show({
        type: "success",
        text1: "Archivo subido",
        text2: "El archivo se ha subido correctamente",
      });

      return true;
    } catch (error: any) {
      const errorMsg = error.message || "No se pudo subir el archivo";
      console.error("Error uploading file:", error);
      onError?.(errorMsg);
      Alert.alert("Error", errorMsg);
      return false;
    } finally {
      setUploading(false);
      setLoading(false);
    }
  }, [user?.id, folderId, addDocument, syncDocuments, setLoading, onSuccess, onError]);

  return {
    uploadFile,
    uploading,
    isSupported: (mimeType: string) => ALLOWED_TYPES.includes(mimeType),
  };
};
