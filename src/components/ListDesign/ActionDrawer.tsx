import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import ActionColorPicker from "./ActionColorPicker";
import CreateFolderModal from "../NewAction/CreateFolderModal";
import { Document } from "../types";
import { useGlobalStore } from "../../store/globalStore";
import { useDocumentsStore } from "../../store/documentsStore";
import { checkInternetConnection } from "../../utils/actions";
import { supabase } from "../../supabase/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as IntentLauncher from "expo-intent-launcher";

interface ActionDrawerProps {
  field: {
    visible?: boolean;
    item?: Document;
  };
}

const ActionDrawer: React.FC<ActionDrawerProps> = ({ field }) => {
  const setLoading = useGlobalStore((state) => state.setLoading);
  const { deleteDocument } = useDocumentsStore();
  const [showVisible, setShowVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isModalColorPickerVisible, setModalColorPickerVisible] = useState(false);

  const handleClose = () => {
    setShowVisible(false);
  };

  const handleFavorite = async (id?: string, status?: boolean) => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      return;
    }

    if (id && status !== undefined) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from("documents")
          .update({ is_favorite: status })
          .eq("id", id)
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

        if (error) {
          throw error;
        }

        useDocumentsStore.setState((state) => {
          const updatedDocuments = state.documents.map((doc) =>
            doc.id === id ? { ...doc, is_favorite: status } : doc
          );
          const updatedFavorites = updatedDocuments.filter(
            (doc) => doc.is_favorite
          );
          return {
            documents: updatedDocuments,
            documentsFavorite: Array.isArray(updatedFavorites)
              ? updatedFavorites
              : [],
          };
        });

        handleClose();
      } catch (error) {
        console.error("Error actualizando favorito:", error);
        Alert.alert("Error", "No se pudo actualizar el estado de favorito.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id?: string) => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      return;
    }

    if (id) {
      Alert.alert(
        "Confirmación",
        "¿Estás seguro de eliminar este registro?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sí, eliminar",
            onPress: async () => {
              setLoading(true);
              try {
                const { error } = await supabase
                  .from("documents")
                  .delete()
                  .eq("id", id)
                  .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

                if (error) {
                  throw error;
                }

                deleteDocument(id);
                handleClose();
              } catch (error) {
                console.error("Error eliminando documento:", error);
                Alert.alert("Error", "No se pudo eliminar el documento.");
              } finally {
                setLoading(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const activeDrawer = () => {
    setShowVisible(false);
    setModalVisible(true);
  };

  const onCloseFolderModal = () => {
    handleClose();
    setModalVisible(false);
  };

  const onCloseColorPickerModal = () => {
    handleClose();
    setModalColorPickerVisible(false);
  };

  const activeDrawerColorPicker = () => {
    if (isModalColorPickerVisible) return;
    setShowVisible(false);
    setModalColorPickerVisible(true);
  };

  const viewFile = async (fileUrl?: string, fileExt?: string) => {
    if (!fileUrl || !fileExt) {
      Alert.alert("Error", "Falta la URL o la extensión del archivo.");
      return;
    }

    try {
      handleClose();
      setLoading(true);

      const normalizedExt = fileExt.toLowerCase().replace(".", "");
      const fileName = fileUrl.split("/").pop() || `tempfile.${normalizedExt}`;
      const localFile = `${FileSystem.documentDirectory}${fileName}`;

      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(fileUrl, 60);
      if (error || !data?.signedUrl) {
        throw error || new Error("No se pudo obtener la URL firmada.");
      }

      const { uri } = await FileSystem.downloadAsync(data.signedUrl, localFile);

      let fileUri = uri;
      if (Platform.OS === "android") {
        // fileUri = await FileSystem.getContentUriAsync(uri);

        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: fileExt,
        });
        return;
      }

      await Linking.openURL(fileUri);
    } catch (error) {
      console.error("Error al visualizar el archivo:", error);
      Alert.alert(
        "Error",
        "No se pudo abrir el archivo. Asegúrate de tener una aplicación compatible instalada."
      );
    } finally {
      setLoading(false);
    }
  };

  const shareFile = async (fileUrl?: string) => {
    if (!fileUrl) {
      Alert.alert("Error", "No se proporcionó una URL válida.");
      return;
    }

    try {
      handleClose();
      setLoading(true);
      const fileName = fileUrl.split("/").pop() || "tempfile";
      const localFile = `${FileSystem.documentDirectory}${fileName}`;

      // Obtener URL firmada de Supabase
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(fileUrl, 60);
      if (error || !data?.signedUrl) {
        throw error || new Error("No se pudo obtener la URL firmada.");
      }

      // Descargar el archivo localmente
      const { uri } = await FileSystem.downloadAsync(data.signedUrl, localFile);

      // Compartir el archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: "Compartir archivo" });
      } else {
        Alert.alert(
          "Error",
          "No se puede compartir el archivo en este dispositivo."
        );
      }
    } catch (error) {
      console.error("Error al compartir el archivo:", error);
      Alert.alert("Error", "No se pudo compartir el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileUrl?: string, fileName?: string) => {
    if (!fileUrl || !fileName) {
      Alert.alert("Error", "Falta la URL o el nombre del archivo.");
      return;
    }

    try {
      handleClose();
      setLoading(true);

      // Obtener URL firmada de Supabase
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(fileUrl, 60);
      if (error || !data?.signedUrl) {
        throw error || new Error("No se pudo obtener la URL firmada.");
      }

      if (Platform.OS === "android") {
        // Comprobar si ya tenemos permisos guardados
        const savedDirUri = await AsyncStorage.getItem("downloadDirUri");
        let dirUri = savedDirUri;

        if (!dirUri) {
          // Solicitar permisos para acceder a la carpeta Descargas
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permissions.granted) {
            Alert.alert(
              "Permisos denegados",
              "Se requieren permisos para guardar archivos en Descargas."
            );
            return;
          }
          dirUri = permissions.directoryUri;
          // Guardar el URI para futuras descargas
          await AsyncStorage.setItem("downloadDirUri", dirUri);
        }

        // Utilizar la carpeta seleccionada sin crear una subcarpeta adicional
        const dokiFilesUri = dirUri;

        // Descargar el archivo temporalmente
        const tempFile = `${FileSystem.cacheDirectory}${fileName}`;
        const { uri: tempUri } = await FileSystem.downloadAsync(
          data.signedUrl,
          tempFile
        );

        // Copiar el archivo a la carpeta DokiFiles
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          dokiFilesUri,
          fileName,
          field.item?.ext || "application/octet-stream"
        );
        const fileBase64 = await FileSystem.readAsStringAsync(tempUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.StorageAccessFramework.writeAsStringAsync(
          fileUri,
          fileBase64,
          { encoding: FileSystem.EncodingType.Base64 }
        );

        Alert.alert(
          "Descarga completada",
          `Archivo guardado en: Descargas/${fileName}`
        );
      } else {
        // iOS: Usar Sharing para permitir al usuario guardar en Descargas
        const downloadDir = `${FileSystem.cacheDirectory}DokiFiles/`;
        await FileSystem.makeDirectoryAsync(downloadDir, {
          intermediates: true,
        });
        const downloadDest = `${downloadDir}${fileName}`;

        const { uri } = await FileSystem.downloadAsync(
          data.signedUrl,
          downloadDest
        );

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            dialogTitle: "Guardar archivo en Descargas",
          });
          Alert.alert(
            "Descarga completada",
            "Por favor, guarda el archivo en la carpeta Descargas desde el diálogo."
          );
        } else {
          Alert.alert(
            "Error",
            "No se puede guardar el archivo en este dispositivo."
          );
        }
      }
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      Alert.alert(
        "Error",
        "No se pudo descargar el archivo. Verifica tu conexión o permisos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShowVisible(field.visible || false);
  }, [field]);

  return (
    <>
      <Modal visible={showVisible} transparent onRequestClose={handleClose}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.modalContainer}>
            <View style={styles.optionsContainer}>
              <View style={styles.header}>
                <Ionicons
                  name={(field.item?.icon as any) || "document-outline"}
                  size={30}
                  color={
                    field.item?.is_folder === true ? field.item?.color : "#888"
                  }
                />
                <Text style={styles.headerText}>
                  {field.item?.name || "Nombre del archivo"}
                </Text>
              </View>
              <TouchableOpacity style={styles.option} onPress={activeDrawer}>
                <Ionicons name="pencil-outline" size={24} color="#888" />
                <Text style={styles.optionText}>Cambiar nombre</Text>
              </TouchableOpacity>
              {field.item?.is_favorite == true ? (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleFavorite(field.item?.id, false)}
                >
                  <Ionicons name="star-outline" size={24} color="#ffa500" />
                  <Text style={styles.optionText}>Quitar de favoritos</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleFavorite(field.item?.id, true)}
                >
                  <Ionicons name="star-outline" size={24} color="#888" />
                  <Text style={styles.optionText}>Agregar a favoritos</Text>
                </TouchableOpacity>
              )}
              {field.item?.is_folder === true && (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => activeDrawerColorPicker()}
                >
                  <Ionicons
                    name="color-palette-outline"
                    size={24}
                    color="#888"
                  />
                  <Text style={styles.optionText}>Cambiar color</Text>
                </TouchableOpacity>
              )}
              {field.item?.is_folder === false && (
                <>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => viewFile(field.item?.path, field.item?.ext)}
                  >
                    <Ionicons name="eye-outline" size={24} color="#888" />
                    <Text style={styles.optionText}>Ver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => shareFile(field.item?.path)}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={24}
                      color="#888"
                    />
                    <Text style={styles.optionText}>Compartir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() =>
                      downloadFile(field.item?.path, field.item?.name)
                    }
                  >
                    <Ionicons name="download-outline" size={24} color="#888" />
                    <Text style={styles.optionText}>Descargar</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleDelete(field.item?.id)}
              >
                <Ionicons name="trash-outline" size={24} color="#888" />
                <Text style={styles.optionText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {isModalVisible === true && (
        <CreateFolderModal
          isVisible={isModalVisible}
          onClose={onCloseFolderModal}
          isItem={field.item}
        />
      )}

      {isModalColorPickerVisible === true && (
        <ActionColorPicker
          isVisible={isModalColorPickerVisible}
          onClose={onCloseColorPickerModal}
          isItem={field.item}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  optionsContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    marginLeft: 8,
    color: "#333",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Karla-Regular",
    marginLeft: 16,
    color: "#444",
  },
});

export default ActionDrawer;
