import { useCallback, useEffect, useState } from "react";
import { useDocumentsStore } from "../store/documentsStore";
import { checkInternetConnection } from "../utils/actions";
import { supabase } from "../supabase/supabaseClient";
import type { Document } from "../components/types";
import Toast from "react-native-toast-message";

export const useFolderDocuments = (folder: Document | null) => {
  const { documentsFolder, setDocumentsFolder } = useDocumentsStore();
  const [loading, setLoading] = useState(false);

  const fetchFolderDocuments = useCallback(async () => {
    console.log("Starting fetchFolderDocuments for folder:", folder?.id || "root");
    if (!folder?.id) {
      console.log("No folder ID, setting empty documents");
      setDocumentsFolder([]);
      return;
    }

    try {
      console.log("Checking internet connection");
      const isOffline = await checkInternetConnection();
      if (isOffline) {
        console.error("Offline, cannot fetch documents");
        Toast.show({
          type: "error",
          text1: "Sin conexión",
          text2: "No se pueden cargar los documentos sin conexión",
        });
        return;
      }

      setLoading(true);
      console.log("Fetching documents from Supabase");
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("folder_id", folder.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Documents fetched successfully:", data);
      setDocumentsFolder(data || []);
    } catch (error) {
      console.error("Error fetching folder documents:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar los documentos de la carpeta",
      });
      setDocumentsFolder([]);
    } finally {
      console.log("Fetch completed, loading:", false);
      setLoading(false);
    }
  }, [folder?.id, setDocumentsFolder]);

  useEffect(() => {
    console.log("useEffect triggered for folder ID:", folder?.id);
    if (folder?.id) {
      fetchFolderDocuments();
    } else {
      console.log("No folder ID, clearing documents");
      setDocumentsFolder([]);
    }
  }, [folder?.id, fetchFolderDocuments, setDocumentsFolder]);

  return {
    folderDocuments: documentsFolder,
    loading,
    refetch: fetchFolderDocuments,
  };
};