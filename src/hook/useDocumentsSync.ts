import { useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useDocumentsStore } from '../store/documentsStore';
import { Document } from '../components/types';
import { useUserStore } from '../store/userStore';

const useDocumentsSync = () => {
  const user = useUserStore((state) => state.user);
  const { setDocuments, setDocumentsFavorite, addDocument, updateDocument, deleteDocument } = useDocumentsStore();

  // Cargar documentos iniciales
  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .is('folder_id', null)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      // Asegúrate de que data sea un array
      const documents = Array.isArray(data) ? data : [];
      setDocuments(documents);
      const favorites = documents.filter((doc: Document) => doc.is_favorite) || [];
      setDocumentsFavorite(favorites);
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
      setDocuments([]);
      setDocumentsFavorite([]);
    }
  };

  useEffect(() => {
    if (!user?.id) return;


    fetchDocuments();

    // Suscripción en tiempo real
    const subscription = supabase
      .channel('documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}, folder_id.is.null`,
        },
        (payload) => {
          const document = payload.new as Document;
          const oldDocument = payload.old as Document;

          switch (payload.eventType) {
            case 'INSERT':
              useDocumentsStore.setState((state) => ({
                documents: [...state.documents, document],
                documentsFavorite: document.is_favorite
                  ? [...state.documentsFavorite, document]
                  : state.documentsFavorite,
              }));
              break;
            case 'UPDATE':
              useDocumentsStore.setState((state) => {
                const updatedDocuments = state.documents.map((doc) =>
                  doc.id === document.id ? { ...doc, ...document } : doc
                );
                const updatedFavorites = updatedDocuments.filter((doc) => doc.is_favorite);
                return {
                  documents: updatedDocuments,
                  documentsFavorite: updatedFavorites,
                };
              });
              break;
            case 'DELETE':
              useDocumentsStore.setState((state) => ({
                documents: state.documents.filter((doc) => doc.id !== oldDocument.id),
                documentsFavorite: state.documentsFavorite.filter(
                  (doc) => doc.id !== oldDocument.id
                ),
              }));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return { fetchDocuments };
};

export default useDocumentsSync;