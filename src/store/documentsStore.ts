import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document } from '../components/types';

interface DocumentsState {
  documents: Document[];
  documentsFavorite: Document[];
  documentsFolder: Document[];
  setDocuments: (documents: Document[]) => void;
  setDocumentsFavorite: (documents: Document[]) => void;
  setDocumentsFolder: (documents: Document[]) => void;
  updateDocument: (payload: { id: string; changes: Partial<Document> }) => void;
  updateDocumentFavorite: (payload: { id: string; changes: Partial<Document> }) => void;
  deleteDocument: (id: string) => void;
  addDocument: (document: Document) => void;
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set) => ({
      documents: [],
      documentsFavorite: [],
      documentsFolder: [],
      setDocuments: (documents) =>
        set({
          documents: Array.isArray(documents) ? documents : [],
        }),
      setDocumentsFavorite: (documentsFavorite) =>
        set({
          documentsFavorite: Array.isArray(documentsFavorite) ? documentsFavorite : [],
        }),
      setDocumentsFolder: (documentsFolder) =>
        set({
          documentsFolder: Array.isArray(documentsFolder) ? documentsFolder : [],
        }),
      updateDocument: ({ id, changes }) =>
        set((state) => {
          const updatedDocuments = state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...changes } : doc
          );
          // Si el cambio afecta a is_favorite, actualizar documentsFavorite
          const updatedFavorites = updatedDocuments.filter((doc) => doc.is_favorite);
          return {
            documents: updatedDocuments,
            documentsFavorite: updatedFavorites,
          };
        }),
      updateDocumentFavorite: ({ id, changes }) =>
        set((state) => ({
          documentsFavorite: state.documentsFavorite.map((doc) =>
            doc.id === id ? { ...doc, ...changes } : doc
          ),
        })),
      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          documentsFavorite: state.documentsFavorite.filter((doc) => doc.id !== id),
        })),
      addDocument: (document) =>
        set((state) => ({
          documents: [...state.documents, document],
          documentsFavorite: document.is_favorite
            ? [...state.documentsFavorite, document]
            : state.documentsFavorite,
        })),
    }),
    {
      name: 'documents-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);