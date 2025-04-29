import { Document } from './src/components/types';
import { create } from 'zustand';

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

export const useDocumentsStore = create<DocumentsState>((set) => ({
  documents: [],
  documentsFavorite: [],
  documentsFolder: [],
  setDocuments: (documents) => set({ documents }),
  setDocumentsFavorite: (documentsFavorite) => set({ documentsFavorite }),
  setDocumentsFolder: (documentsFolder) => set({ documentsFolder }),
  updateDocument: ({ id, changes }) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...changes } : doc
      ),
    })),
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
}));