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
    if (!folder?.id) {
      setDocumentsFolder([]);
      return;
    }

    try {
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
      setLoading(false);
    }
  }, [folder?.id, setDocumentsFolder]);

  useEffect(() => {
    if (folder?.id) {
      fetchFolderDocuments();
    } else {
      setDocumentsFolder([]);
    }
  }, [folder?.id, fetchFolderDocuments, setDocumentsFolder]);

  return {
    folderDocuments: documentsFolder,
    loading,
    refetch: fetchFolderDocuments,
  };
};