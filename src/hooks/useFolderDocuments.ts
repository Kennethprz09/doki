import { useCallback, useEffect, useState } from "react";
import { useDocumentsStore } from "../store/documentsStore";
import { useUserStore } from "../store/userStore";
import { checkInternetConnection } from "../utils/actions";
import { supabase } from "../supabase/supabaseClient";
import type { Document } from "../components/types";
import Toast from "react-native-toast-message";

export const useFolderDocuments = (folder: Document | null) => {
  const { documentsFolder, setDocumentsFolder } = useDocumentsStore();
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const fetchFolderDocuments = useCallback(async () => {
    if (!folder?.id) {
      setDocumentsFolder([]);
      return;
    }

    try {
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        Toast.show({
          type: "error",
          text1: "Sin conexión",
          text2: "No se pueden cargar los documentos sin conexión",
        });
        return;
      }

      if (!user?.id) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("folder_id", folder.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDocumentsFolder(data || []);
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar los documentos de la carpeta",
      });
      setDocumentsFolder([]);
    } finally {
      setLoading(false);
    }
  }, [folder?.id, user?.id, setDocumentsFolder]);

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