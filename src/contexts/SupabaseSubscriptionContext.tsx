// src/contexts/SupabaseSubscriptionContext.tsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useUserStore } from '../store/userStore';
import { useDocumentsStore } from '../store/documentsStore';
import { Document } from '../components/types';

type SubscriptionContextType = {
  isSubscribed: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
});

export const SupabaseSubscriptionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const user = useUserStore((state) => state.user);
  const { setDocuments, setDocumentsFavorite } = useDocumentsStore();
  const isSubscribedRef = useRef(false); // Usamos una referencia en lugar de estado

  useEffect(() => {
    if (!user?.id || isSubscribedRef.current) return;

    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .is('folder_id', null)
          .eq('user_id', user.id);

        if (error) throw error;

        const documents = Array.isArray(data) ? data : [];
        setDocuments(documents);
        setDocumentsFavorite(documents.filter((doc: Document) => doc.is_favorite));
      } catch (error) {
        console.error('Error fetching documents:', error);
        setDocuments([]);
        setDocumentsFavorite([]);
      }
    };

    fetchDocuments();

    const channel = supabase
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

    isSubscribedRef.current = true; // Marcamos como suscrito

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        isSubscribedRef.current = false;
      }
    };
  }, [user?.id]);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed: isSubscribedRef.current }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSupabaseSubscription = () => useContext(SubscriptionContext);