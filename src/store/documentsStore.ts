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
  setDocumentsFolder: (documentsFolder: Document[]) => void // Nueva acción para documentos de carpeta
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateDocument: (payload: { id: string; changes: Partial<Document> }) => void
  updateDocumentFavorite: (payload: { id: string; changes: Partial<Document> }) => void
  deleteDocument: (id: string) => void
  addDocument: (document: Document) => void
  clearDocuments: () => void

  // Computed getters
  getFavoriteDocuments: () => Document[]
  getDocumentById: (id: string) => Document | undefined
  getDocumentsByFolder: (folderId: string) => Document[]
}

// Optimización 1: Función para validar documentos
const validateDocuments = (documents: any): documents is Document[] => {
  return (
    Array.isArray(documents) && documents.every((doc) => doc && typeof doc === "object" && typeof doc.id === "string")
  )
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documents: [],
      documentsFavorite: [],
      documentsFolder: [], // Inicializar
      isLoading: false,
      error: null,
      lastSync: null,

      setDocuments: (documents) => {
        const validDocuments = validateDocuments(documents) ? documents : []
        set({
          documents: validDocuments.filter((doc) => !doc.folder_id), // Asegurar que solo sean documentos raíz
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
        set({ documentsFolder: validDocuments }) // Establecer directamente los documentos de la carpeta
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      // Optimización 2: Actualización más eficiente con immer-like pattern
      updateDocument: ({ id, changes }) => {
        set((state) => {
          // Actualizar en documents (raíz)
          const updatedRootDocuments = state.documents.map((doc) => (doc.id === id ? { ...doc, ...changes } : doc))
          // Actualizar en documentsFolder (si aplica)
          const updatedFolderDocuments = state.documentsFolder.map((doc) =>
            doc.id === id ? { ...doc, ...changes } : doc,
          )
          // Actualizar en documentsFavorite (si aplica)
          const updatedFavoriteDocuments = state.documentsFavorite.map((doc) =>
            doc.id === id ? { ...doc, ...changes } : doc,
          )

          return {
            documents: updatedRootDocuments.filter((doc) => !doc.folder_id), // Re-filtrar para asegurar solo raíz
            documentsFavorite: updatedFavoriteDocuments.filter((doc) => doc.is_favorite), // Re-filtrar favoritos
            documentsFolder: updatedFolderDocuments,
            lastSync: new Date().toISOString(),
          }
        })
      },

      updateDocumentFavorite: ({ id, changes }) => {
        set((state) => {
          // Actualizar en documents (raíz)
          const updatedRootDocuments = state.documents.map((doc) => (doc.id === id ? { ...doc, ...changes } : doc))
          // Actualizar en documentsFolder (si aplica)
          const updatedFolderDocuments = state.documentsFolder.map((doc) =>
            doc.id === id ? { ...doc, ...changes } : doc,
          )
          // Actualizar en documentsFavorite
          const updatedFavorites = state.documentsFavorite.map((doc) => (doc.id === id ? { ...doc, ...changes } : doc))

          return {
            documents: updatedRootDocuments,
            documentsFavorite: updatedFavorites.filter((doc) => doc.is_favorite),
            documentsFolder: updatedFolderDocuments,
            lastSync: new Date().toISOString(),
          }
        })
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          documentsFavorite: state.documentsFavorite.filter((doc) => doc.id !== id),
          documentsFolder: state.documentsFolder.filter((doc) => doc.id !== id), // Eliminar también de documentsFolder
          lastSync: new Date().toISOString(),
        }))
      },

      addDocument: (document) => {
        set((state) => {
          const newDocuments = document.folder_id ? state.documents : [...state.documents, document] // Añadir a raíz si no tiene folder_id
          const newDocumentsFolder = document.folder_id ? [...state.documentsFolder, document] : state.documentsFolder // Añadir a folder si tiene folder_id
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

      // Optimización 3: Getters computados para mejor rendimiento
      getFavoriteDocuments: () => {
        return get().documents.filter((doc) => doc.is_favorite)
      },

      getDocumentById: (id) => {
        // Buscar en todos los arrays para mayor cobertura
        return (
          get().documents.find((doc) => doc.id === id) ||
          get().documentsFavorite.find((doc) => doc.id === id) ||
          get().documentsFolder.find((doc) => doc.id === id)
        )
      },

      getDocumentsByFolder: (folderId) => {
        // Este getter ahora puede ser más directo si documentsFolder ya está filtrado
        return get().documentsFolder.filter((doc) => doc.folder_id === folderId)
      },
    }),
    {
      name: "documents-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Optimización 4: Partición del estado para mejor rendimiento
      partialize: (state) => ({
        documents: state.documents,
        documentsFavorite: state.documentsFavorite,
        documentsFolder: state.documentsFolder, // Persistir también documentsFolder
        lastSync: state.lastSync,
      }),
    },
  ),
)

// Optimización 5: Selectores específicos para evitar re-renders
export const useDocuments = () => useDocumentsStore((state) => state.documents)
export const useFavoriteDocuments = () => useDocumentsStore((state) => state.documentsFavorite)
export const useFolderDocumentsState = () => useDocumentsStore((state) => state.documentsFolder) // Nuevo selector
export const useDocumentsLoading = () => useDocumentsStore((state) => state.isLoading)
