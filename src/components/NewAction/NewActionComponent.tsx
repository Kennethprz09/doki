import React, { useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useUserStore } from "../../store/userStore";
import { useGlobalStore } from "../../store/globalStore";
import { useDocumentsStore } from "../../store/documentsStore";
import { checkInternetConnection } from "../../utils/actions";
import { Document as DocType } from "../types";
import { supabase } from "../../supabase/supabaseClient";
import NewButton from "./NewButton";
import OptionsModal from "./OptionsModal";
import CameraModal from "./CameraModal";
import PreviewModal from "./PreviewModal";
import CreateFolderModal from "./CreateFolderModal";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import * as Print from "expo-print";
import { Camera } from "expo-camera";

interface NewActionComponentProps {
  folder?: { folder?: Partial<DocType> };
}

const NewActionComponent: React.FC<NewActionComponentProps> = ({
  folder = {},
}) => {
  const user = useUserStore((state) => state.user);
  const setLoading = useGlobalStore((state) => state.setLoading);
  const { addDocument } = useDocumentsStore();
  const [showOptions, setShowOptions] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCameraModalVisible, setCameraModalVisible] = useState(false);
  const [isPreviewModalVisible, setPreviewModalVisible] = useState(false);
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const [isCapturingBack, setIsCapturingBack] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Se necesita acceso a la cámara para escanear documentos."
      );
      return false;
    }
    return true;
  };

  const handleFileUpload = async () => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      Alert.alert(
        "Sin conexión",
        "Por favor, verifica tu conexión a internet."
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Usuario no autenticado.");
      return;
    }

    setShowOptions(false);
    setLoading(true);

    try {
      const pickedFile = await DocumentPicker.getDocumentAsync({
        type: [
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
        ],
        copyToCacheDirectory: true,
      });

      if (pickedFile.canceled) {
        return;
      }

      const file = pickedFile.assets[0];

      if (file.size && file.size > MAX_FILE_SIZE) {
        throw new Error("El archivo excede el límite de 10MB.");
      }

      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const fileData = Buffer.from(fileContent, "base64");

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, fileData, {
          contentType: file.mimeType || "application/octet-stream",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            name: file.name,
            size: file.size || 0,
            ext: file.mimeType || "application/octet-stream",
            user_id: user.id,
            folder_id: folder?.folder?.id || null,
            is_folder: false,
            path: filePath,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      addDocument({
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
      });
    } catch (error) {
      console.error("Error al seleccionar o enviar el archivo:", error);
      Alert.alert("Error", error.message || "No se pudo subir el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanDocument = async () => {
    setShowOptions(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setFrontPhoto(null);
    setBackPhoto(null);
    setIsCapturingBack(false);
    setCameraModalVisible(true);
  };

  const handleTakePicture = (photoUri: string) => {
    if (isCapturingBack) {
      setBackPhoto(photoUri);
      setCameraModalVisible(false);
      setPreviewModalVisible(true);
    } else {
      setFrontPhoto(photoUri);
      Alert.alert(
        "¿Tomar foto trasera?",
        "¿Deseas tomar una foto de la parte trasera del documento?",
        [
          {
            text: "No",
            onPress: () => {
              setCameraModalVisible(false);
              setPreviewModalVisible(true);
            },
          },
          {
            text: "Sí",
            onPress: () => setIsCapturingBack(true),
          },
        ]
      );
    }
  };

  const saveAsPDF = async () => {
    setPreviewModalVisible(false);
    if (!frontPhoto) {
      Alert.alert("Error", "La foto frontal es obligatoria.");
      return;
    }

    const isOffline = await checkInternetConnection();
    if (isOffline) {
      Alert.alert(
        "Sin conexión",
        "Por favor, verifica tu conexión a internet."
      );
      return;
    }

    setLoading(true);

    try {
      // Leer imágenes como Base64
      const frontPhotoBase64 = await FileSystem.readAsStringAsync(frontPhoto, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const backPhotoBase64 = backPhoto
        ? await FileSystem.readAsStringAsync(backPhoto, {
            encoding: FileSystem.EncodingType.Base64,
          })
        : null;

      // Validar tamaño aproximado
      const estimatedSize =
        frontPhotoBase64.length +
        (backPhotoBase64 ? backPhotoBase64.length : 0);
      // if (estimatedSize > MAX_FILE_SIZE * 0.75) {
      //   Alert.alert(
      //     "Error",
      //     "El tamaño de las imágenes excede el límite permitido. Intenta capturar nuevamente."
      //   );
      //   setLoading(false);
      //   return;
      // }

      // Crear HTML con imágenes incrustadas
      const htmlContent = `
      <html>
        <body style="margin: 0; padding: 20px;">
          <h1>Documento Escaneado</h1>
          <img src="data:image/jpeg;base64,${frontPhotoBase64}" style="width: 100%; max-width: 400px;" />
          ${
            backPhotoBase64
              ? `<img src="data:image/jpeg;base64,${backPhotoBase64}" style="width: 100%; max-width: 400px;" />`
              : ""
          }
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true,
      });

      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Validar tamaño del PDF
      if (fileContent.length > MAX_FILE_SIZE) {
        throw new Error("El PDF generado excede el límite de 1MB.");
      }

      const fileName = `scanned_${Date.now()}.pdf`;
      const filePath = `${user!.id}/${fileName}`;
      const fileData = Buffer.from(fileContent, "base64");

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, fileData, {
          contentType: "application/pdf",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            name: fileName,
            size: fileContent.length,
            ext: "application/pdf",
            user_id: user!.id,
            folder_id: folder?.folder?.id || null,
            is_folder: false,
            path: filePath,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      addDocument({
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
      });

      Alert.alert("Éxito", "Documento escaneado y guardado como PDF.");
    } catch (error) {
      console.error("Error al generar o guardar el PDF:", error);
      Alert.alert("Error", error.message || "No se pudo guardar el documento.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeFront = () => {
    setFrontPhoto(null);
    setIsCapturingBack(false);
    setPreviewModalVisible(false);
    setCameraModalVisible(true);
    setIsCapturingBack(false);
  };

  const handleRetakeBack = () => {
    setBackPhoto(null);
    setIsCapturingBack(true);
    setPreviewModalVisible(false);
    setCameraModalVisible(true);
    setIsCapturingBack(true);
  };

  const handleUpdateFrontPhoto = (uri: string) => {
    setFrontPhoto(uri);
  };

  const handleUpdateBackPhoto = (uri: string) => {
    setBackPhoto(uri);
  };

  return (
    <View style={styles.container}>
      <NewButton onPress={() => setShowOptions(true)} />
      <OptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onCreateFolder={() => {
          setShowOptions(false);
          setModalVisible(true);
        }}
        onUploadFile={handleFileUpload}
        onScanDocument={handleScanDocument}
        showFolderOption={!folder?.folder?.id}
      />
      <CameraModal
        visible={isCameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onTakePicture={handleTakePicture}
      />
      <PreviewModal
        visible={isPreviewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        frontPhoto={frontPhoto}
        backPhoto={backPhoto}
        onRetakeFront={handleRetakeFront}
        onRetakeBack={handleRetakeBack}
        onSave={saveAsPDF}
        onUpdateFrontPhoto={handleUpdateFrontPhoto}
        onUpdateBackPhoto={handleUpdateBackPhoto}
      />
      {CreateFolderModal && (
        <CreateFolderModal
          isVisible={isModalVisible}
          onClose={() => setModalVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0.17,
    backgroundColor: "#fff",
  },
});

export default NewActionComponent;
