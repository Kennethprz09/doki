// useFileUpload.ts
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from "buffer";
import { useUserStore } from "../store/userStore";
import { useDocumentsStore } from "../store/documentsStore";
import { useGlobalStore } from "../store/globalStore";
import { checkInternetConnection } from "../utils/actions";
import { supabase } from "../supabase/supabaseClient";
import type { Document } from "../components/types";

interface UseFileUploadProps {
  folderId?: string | null;
  onSuccess?: (document: Document) => void;
  onError?: (error: string) => void;
}

export const useFileUpload = ({ folderId, onSuccess, onError }: UseFileUploadProps = {}) => {
  const user = useUserStore((state) => state.user);
  const { addDocument } = useDocumentsStore();
  const { setLoading } = useGlobalStore();
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
      console.log("Starting file upload process");

      // Verificar conectividad
      console.log("Checking internet connection");
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
      console.log("Checking user authentication");
      if (!user?.id) {
        const errorMsg = "Usuario no autenticado";
        onError?.(errorMsg);
        Alert.alert("Error", errorMsg);
        return false;
      }

      setUploading(true);
      setLoading(true);

      // Seleccionar archivo
      console.log("Opening DocumentPicker");
      const pickedFile = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_TYPES,
        copyToCacheDirectory: true,
      });

      console.log("DocumentPicker result:", pickedFile);

      if (pickedFile.canceled) {
        console.log("File selection canceled");
        return false;
      }

      const file = pickedFile.assets[0];

      // Validar tamaño
      console.log("Validating file size:", file.size);
      if (file.size && file.size > MAX_FILE_SIZE) {
        const errorMsg = "El archivo excede el límite de 10MB";
        onError?.(errorMsg);
        Alert.alert("Error", errorMsg);
        return false;
      }

      // Leer archivo
      console.log("Reading file:", file.uri);
      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("File read successfully, size:", fileContent.length);

      // Subir a storage
      console.log("Uploading file to Supabase storage");
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const fileData = Buffer.from(fileContent, "base64");

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, fileData, {
        contentType: file.mimeType || "application/octet-stream",
      });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("File uploaded successfully to:", filePath);

      // Guardar en base de datos
      console.log("Inserting document metadata into Supabase database");
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

      console.log("Document inserted into database:", data);

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

      console.log("Adding document to store:", newDocument);
      addDocument(newDocument);
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
      console.log("Upload process completed, resetting states");
      setUploading(false);
      setLoading(false);
    }
  }, [user?.id, folderId, addDocument, setLoading, onSuccess, onError]);

  return {
    uploadFile,
    uploading,
    isSupported: (mimeType: string) => ALLOWED_TYPES.includes(mimeType),
  };
};