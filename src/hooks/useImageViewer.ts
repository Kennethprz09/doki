"use client";

import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { supabase } from "../supabase/supabaseClient";
import { useGlobalStore } from "../store/globalStore";
import * as WebBrowser from 'expo-web-browser';

export const useImageViewer = () => {
  const { setLoading } = useGlobalStore();

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

  // Función para extraer extensión real
  const extractFileExtension = useCallback(
    (fileUrl: string, providedExt?: string): string => {
      if (providedExt && providedExt.includes("/")) {
        providedExt = undefined;
      }

      if (providedExt && !providedExt.includes("/")) {
        return providedExt.toLowerCase().replace(".", "");
      }

      const urlParts = fileUrl.split(".");
      if (urlParts.length > 1) {
        const ext = urlParts[urlParts.length - 1].split("?")[0];
        return ext.toLowerCase();
      }

      return "";
    },
    []
  );

  const viewImage = useCallback(
    async (fileUrl: string, fileName?: string, fileExt?: string) => {
      try {
        setLoading(true);

        const realExtension = extractFileExtension(fileUrl, fileExt);
        const mimeType = getMimeType(realExtension); // Función que debes definir

        if (!ALLOWED_TYPES.includes(mimeType)) {
          throw new Error("Tipo de archivo no permitido.");
        }

        const { data, error } = await supabase.storage
          .from("documents")
          .createSignedUrl(fileUrl, 60);

        if (error || !data?.signedUrl) {
          throw new Error("No se pudo obtener la URL firmada.");
        }

        const finalFileName =
          fileName || fileUrl.split("/").pop() || `file.${realExtension}`;
        const localFile = `${FileSystem.cacheDirectory}${finalFileName}`;

        const { uri } = await FileSystem.downloadAsync(
          data.signedUrl,
          localFile
        );

        if (Platform.OS === "android") {
          const contentUri = await FileSystem.getContentUriAsync(uri);

          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              type: mimeType,
              flags: 1,
            }
          );
        } else {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              dialogTitle: "Ver archivo",
              mimeType,
            });
          } else {
            // Fallback: abrir en navegador si es compatible
            await WebBrowser.openBrowserAsync(uri);
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Error viewing file:", error);
        Alert.alert(
          "Error",
          "No se pudo abrir el archivo. Verifica que tengas una app compatible instalada."
        );
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, extractFileExtension]
  );

  const getMimeType = (ext: string): string => {
    const map: Record<string, string> = {
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
    };
    return map[ext.toLowerCase()] || "application/octet-stream";
  };

  return { viewImage };
};