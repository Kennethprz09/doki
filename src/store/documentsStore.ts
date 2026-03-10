import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Document } from "../components/types"

interface DocumentsState {
  documents: Document[] // Documentos raíz (sin folder_id)
  documentsFavorite: Document[] // Todos los documentos favoritos
  documentsFolder: Document[] // Documentos de la carpeta actualmente abierta
  isLoading: boolean
  error: string | null
  lastSync: string | null

  // Actions
  setDocuments: (documents: Document[]) => void
  setDocumentsFavorite: (documents: Document[]) => void
  setDocumentsFolder: (documentsFolder: Document[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateDocument: (payload: { id: string; changes: Partial<Document> }) => void
  deleteDocument: (id: string) => void
  addDocument: (document: Document) => void
  clearDocuments: () => void
}

const validateDocuments = (documents: any): documents is Document[] => {
  return (
    Array.isArray(documents) && documents.every((doc) => doc && typeof doc === "object" && typeof doc.id === "string")
  )
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set) => ({
      documents: [],
      documentsFavorite: [],
      documentsFolder: [],
      isLoading: false,
      error: null,
      lastSync: null,

      setDocuments: (documents) => {
        const validDocuments = validateDocuments(documents) ? documents : []
        set({
          documents: validDocuments.filter((doc) => !doc.folder_id),
          documentsFavorite: validDocuments.filter((doc) => doc.is_favorite),
          lastSync: new Date().toISOString(),
          error: null,
        })
      },

      setDocumentsFavorite: (documentsFavorite) => {
        const validDocuments = validateDocuments(documentsFavorite) ? documentsFavorite : []
        set({ documentsFavorite: validDocuments })
      },

      setDocumentsFolder: (documentsFolder) => {
        const validDocuments = validateDocuments(documentsFolder) ? documentsFolder : []
        set({ documentsFolder: validDocuments })
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      updateDocument: ({ id, changes }) => {
        set((state) => {
          const updatedRootDocuments = state.documents.map((doc) => (doc.id === id ? { ...doc, ...changes } : doc))
          const updatedFolderDocuments = state.documentsFolder.map((doc) =>
            doc.id === id ? { ...doc, ...changes } : doc,
          )
          const updatedFavoriteDocuments = state.documentsFavorite.map((doc) =>
            doc.id === id ? { ...doc, ...changes } : doc,
          )

          return {
            documents: updatedRootDocuments.filter((doc) => !doc.folder_id),
            documentsFavorite: updatedFavoriteDocuments.filter((doc) => doc.is_favorite),
            documentsFolder: updatedFolderDocuments,
            lastSync: new Date().toISOString(),
          }
        })
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          documentsFavorite: state.documentsFavorite.filter((doc) => doc.id !== id),
          documentsFolder: state.documentsFolder.filter((doc) => doc.id !== id),
          lastSync: new Date().toISOString(),
        }))
      },

      addDocument: (document) => {
        set((state) => {
          const newDocuments = document.folder_id ? state.documents : [...state.documents, document]
          const newDocumentsFolder = document.folder_id ? [...state.documentsFolder, document] : state.documentsFolder
          const newDocumentsFavorite = document.is_favorite
            ? [...state.documentsFavorite, document]
            : state.documentsFavorite

          return {
            documents: newDocuments,
            documentsFavorite: newDocumentsFavorite,
            documentsFolder: newDocumentsFolder,
            lastSync: new Date().toISOString(),
          }
        })
      },

      clearDocuments: () => {
        set({
          documents: [],
          documentsFavorite: [],
          documentsFolder: [],
          lastSync: null,
        })
      },
    }),
    {
      name: "documents-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistir documentos raíz y favoritos; documentsFolder es transiente
      partialize: (state) => ({
        documents: state.documents,
        documentsFavorite: state.documentsFavorite,
        lastSync: state.lastSync,
      }),
    },
  ),
)
