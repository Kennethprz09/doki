"use client";

import { useCallback, useEffect } from "react";
import { Alert, Platform } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import * as FileSystem from "expo-file-system/legacy";
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { supabase } from "../supabase/supabaseClient";
import { useGlobalStore } from "../store/globalStore";
import * as Linking from "expo-linking";

interface FileOperationResult {
  success: boolean;
  error?: string;
}

export const useFileOperations = () => {
  const { setLoading } = useGlobalStore();

  useEffect(() => {
    console.log("useEffect en useFileOperations ejecutado");

    const initDownloadsDir = async () => {
      const downloadsDir = new Directory(Paths.cache, "downloaded_files");
      if (!downloadsDir.exists) {
        await downloadsDir.create();
      }
    };
    initDownloadsDir();
  }, []);

  // Función común para obtener URL firmada y descargar archivo
  const downloadFileToCache = useCallback(
    async (
      fileUrl: string
    ): Promise<{ uri: string; signedUrl: string } | null> => {
      try {
        const { data, error } = await supabase.storage
          .from("documents")
          .createSignedUrl(fileUrl, 60);

        if (error || !data?.signedUrl) {
          throw new Error("No se pudo obtener la URL firmada.");
        }

        // Generar nombre único con timestamp y ID aleatorio
        const timestamp = Date.now();
        const randomId = Math.floor(Math.random() * 10000);
        const fileName = `${timestamp}_${randomId}_${fileUrl.split("/").pop()}`;

        const downloadsDir = new Directory(Paths.cache, "downloaded_files");
        const outputFile = new File(downloadsDir, fileName);

        const downloadedFile = await File.downloadFileAsync(
          data.signedUrl,
          outputFile
        );

        return {
          uri: downloadedFile.uri,
          signedUrl: data.signedUrl,
        };
      } catch (error) {
        console.error("Error downloading file to cache:", error);
        return null;
      }
    },
    []
  );

  // Función auxiliar para determinar MIME types
  const getMimeType = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      txt: "text/plain",
    };
    return mimeTypes[extension || ""] || "application/octet-stream";
  };

  // Función auxiliar para Uniform Type Identifiers (iOS)
  const getUniformTypeIdentifier = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase();
    const utis: { [key: string]: string } = {
      pdf: "com.adobe.pdf",
      doc: "com.microsoft.word.doc",
      docx: "org.openxmlformats.wordprocessingml.document",
      xls: "com.microsoft.excel.xls",
      xlsx: "org.openxmlformats.spreadsheetml.sheet",
      ppt: "com.microsoft.powerpoint.ppt",
      pptx: "org.openxmlformats.presentationml.presentation",
      jpg: "public.jpeg",
      jpeg: "public.jpeg",
      png: "public.png",
      txt: "text/plain",
    };
    return utis[extension || ""] || "public.data";
  };

  const extractFileExtension = useCallback(
    (fileUrl: string, providedExt?: string): string => {
      // Si providedExt parece ser un MIME type, ignorarlo
      if (providedExt && providedExt.includes("/")) {
        providedExt = undefined;
      }

      // Si tenemos una extensión válida, usarla
      if (providedExt && !providedExt.includes("/")) {
        return providedExt.toLowerCase().replace(".", "");
      }

      // Extraer extensión de la URL
      const urlParts = fileUrl.split(".");
      if (urlParts.length > 1) {
        const ext = urlParts[urlParts.length - 1].split("?")[0]; // Remover query params
        return ext.toLowerCase();
      }

      return "";
    },
    []
  );

  // Función viewFile corregida
  const viewFile = useCallback(
    async (
      fileUrl?: string,
      fileExt?: string,
      fileName?: string
    ): Promise<FileOperationResult> => {
      if (!fileUrl) {
        Alert.alert("Error", "Falta la URL del archivo.");
        return { success: false, error: "Missing file URL" };
      }

      try {
        setLoading(true);

        // Extraer la extensión correcta
        const realExtension = extractFileExtension(fileUrl, fileExt);
        const finalFileName =
          fileName || fileUrl.split("/").pop() || `tempfile.${realExtension}`;
        const mimeType = getMimeType(realExtension);

        const downloadResult = await downloadFileToCache(fileUrl);
        if (!downloadResult) {
          throw new Error("No se pudo descargar el archivo.");
        }

        if (Platform.OS === "android") {
          try {
            const contentUri = await FileSystem.getContentUriAsync(
              downloadResult.uri
            );

            // Para imágenes, usar intent específico
            if (mimeType.startsWith("image/")) {
              // Intentar con la galería primero
              try {
                await IntentLauncher.startActivityAsync(
                  "android.intent.action.VIEW",
                  {
                    data: contentUri,
                    type: mimeType,
                    flags: 1,
                    category: "android.intent.category.DEFAULT",
                  }
                );
              } catch (galleryError) {
                // Fallback: intent genérico para imágenes
                await IntentLauncher.startActivityAsync(
                  "android.intent.action.VIEW",
                  {
                    data: contentUri,
                    type: "image/*",
                    flags: 1,
                  }
                );
              }
            } else {
              // Para otros archivos
              await IntentLauncher.startActivityAsync(
                "android.intent.action.VIEW",
                {
                  data: contentUri,
                  type: mimeType,
                  flags: 1,
                }
              );
            }
          } catch (intentError) {
            console.error("Intent error:", intentError);
            // Fallback: usar sharing
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(downloadResult.uri, {
                dialogTitle: `Abrir ${finalFileName}`,
                mimeType: mimeType,
              });
            } else {
              throw new Error(
                "No se encontró una aplicación para abrir este tipo de archivo."
              );
            }
          }
        } else {
          // iOS
          const canOpen = await Linking.canOpenURL(downloadResult.uri);
          if (canOpen) {
            await Linking.openURL(downloadResult.uri);
          } else {
            // Fallback para iOS
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(downloadResult.uri, {
                dialogTitle: `Abrir ${finalFileName}`,
              });
            } else {
              throw new Error(
                "No se puede abrir el archivo en este dispositivo."
              );
            }
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Error viewing file:", error);

        let errorMessage = "No se pudo abrir el archivo.";

        if (error instanceof Error) {
          if (error.message.includes("No Activity found")) {
            errorMessage =
              "No se encontró una aplicación para abrir este tipo de archivo. Por favor, instala una aplicación compatible.";
          } else if (error.message.includes("Permission")) {
            errorMessage = "No tienes permisos para abrir este archivo.";
          } else {
            errorMessage = error.message;
          }
        }

        Alert.alert("Error", errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [downloadFileToCache, setLoading, extractFileExtension]
  );

  // Función optimizada para compartir archivos
  const shareFile = useCallback(
    async (fileUrl?: string): Promise<FileOperationResult> => {
      if (!fileUrl) {
        Alert.alert("Error", "No se proporcionó una URL válida.");
        return { success: false, error: "No file URL provided" };
      }

      try {
        setLoading(true);

        const downloadResult = await downloadFileToCache(fileUrl);
        if (!downloadResult) {
          throw new Error("No se pudo descargar el archivo.");
        }

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            dialogTitle: "Compartir archivo",
          });
          return { success: true };
        } else {
          throw new Error(
            "No se puede compartir el archivo en este dispositivo."
          );
        }
      } catch (error) {
        const errorMessage = "No se pudo compartir el archivo.";
        console.error("Error sharing file:", error);
        Alert.alert("Error", errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [downloadFileToCache, setLoading]
  );

  // Function optimizada para descargar archivos
  const downloadFile = useCallback(
    async (
      fileUrl: string,
      originalFileName: string
    ): Promise<FileOperationResult> => {
      if (!fileUrl) {
        Alert.alert("Error", "No se proporcionó una URL válida.");
        return { success: false, error: "Missing required parameters" };
      }

      try {
        setLoading(true);

        // 1. Obtener la URL firmada de Supabase
        const { data, error } = await supabase.storage
          .from("documents")
          .createSignedUrl(fileUrl, 60);

        if (error || !data?.signedUrl) {
          throw new Error("No se pudo obtener la URL firmada.");
        }

        // 2. Descargar el archivo a la caché de la app primero
        const downloadResult = await downloadFileToCache(fileUrl);
        if (!downloadResult) {
          throw new Error("No se pudo descargar el archivo a la caché.");
        }

        // 3. Plataforma: Android - Usar Storage Access Framework
        if (Platform.OS === "android") {
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (!permissions.granted) {
            await Sharing.shareAsync(downloadResult.uri, {
              dialogTitle: "Compartir archivo",
            });
            return { success: true };
          }

          // Obtener información del archivo descargado
          const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
          if (!fileInfo.exists || fileInfo.size === 0) {
            throw new Error("El archivo descargado está vacío o no existe.");
          }

          // Leer el contenido del archivo descargado
          const fileContent = await FileSystem.readAsStringAsync(
            downloadResult.uri,
            {
              encoding: FileSystem.EncodingType.Base64,
            }
          );

          // Crear el archivo en el directorio seleccionado con el contenido
          const newFileUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              originalFileName,
              getMimeType(originalFileName) // Función auxiliar para determinar MIME type
            );

          // Escribir el contenido en el nuevo archivo
          await FileSystem.StorageAccessFramework.writeAsStringAsync(
            newFileUri,
            fileContent,
            { encoding: FileSystem.EncodingType.Base64 }
          );

          Alert.alert("Éxito", "Archivo descargado correctamente.");
          return { success: true };
        }
        // 4. Plataforma: iOS - Usar expo-sharing para abrir el panel de compartir/guardar
        else {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloadResult.uri, {
              dialogTitle: "Guardar archivo",
              mimeType: getMimeType(originalFileName), // MIME type específico
              UTI: getUniformTypeIdentifier(originalFileName), // UTI específico para iOS
            });
            return { success: true };
          } else {
            throw new Error(
              "Compartir no está disponible en este dispositivo."
            );
          }
        }
      } catch (error) {
        const errorMessage =
          "No se pudo descargar el archivo. Verifica tu conexión o permisos.";
        console.error("Error downloading file:", error);
        Alert.alert("Error", errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [downloadFileToCache, setLoading]
  );

  return {
    viewFile,
    shareFile,
    downloadFile,
  };
};
