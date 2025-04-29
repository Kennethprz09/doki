import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { Document } from './src/components/types';
import { useDocumentsStore } from './src/store/documentsStore';
import { supabase } from './src/supabase/supabaseClient';

interface Filter {
  name?: string;
  order?: Array<{ field: string; type: 'asc' | 'desc' }>;
  folder_id_Null?: number;
}

interface FilterFolder {
  name?: string;
  order?: Array<{ field: string; type: 'asc' | 'desc' }>;
  folder_id?: string;
}

export const checkInternetConnection = async () => {
  const networkState = await Network.getNetworkStateAsync();
  return !networkState.isConnected;
};

export const syncUser = async () => {
  const userData = await AsyncStorage.getItem('user');
  if (!userData) return;

  const parsedUser = JSON.parse(userData);
  const userId = parsedUser.id;

  try {
    // Intentar obtener el perfil
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Usar maybeSingle en lugar de single para manejar 0 filas

    if (error && error.code !== 'PGRST116') {
      console.error('Error syncing user:', error);
      return;
    }

    // Si no existe el perfil, crearlo
    if (!data) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: parsedUser.email,
            name: parsedUser.name,
            surname: parsedUser.surname,
          },
        ]);

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return;
      }

      // Reintentar obtener el perfil
      const { data: newData, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching new profile:', fetchError);
        return;
      }

      data = newData;
    }

    // Actualizar AsyncStorage con los datos del perfil
    await AsyncStorage.setItem('user', JSON.stringify(data));
  } catch (error) {
    console.error('Error syncing user:', error);
  }
};

export const listDocuments = async (filter: Filter = {}) => {
  const setDocuments = useDocumentsStore.getState().setDocuments;
  const setDocumentsFavorite = useDocumentsStore.getState().setDocumentsFavorite;

  const isOffline = await checkInternetConnection();
  if (isOffline) {
    const documentsOffline = await AsyncStorage.getItem('documents');
    const documentsFavoriteOffline = await AsyncStorage.getItem('documentsFavorite');
    if (documentsOffline) {
      setDocuments(JSON.parse(documentsOffline));
    }
    if (documentsFavoriteOffline) {
      setDocumentsFavorite(JSON.parse(documentsFavoriteOffline));
    }
    return;
  }

  try {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (filter.name) {
      query = query.ilike('name', `%${filter.name}%`);
    }

    if (filter.order) {
      filter.order.forEach((order) => {
        query = query.order(order.field, { ascending: order.type === 'asc' });
      });
    }

    if (filter.folder_id_Null) {
      query = query.is('folder_id', null);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    setDocuments(data);

    const favorites = data.filter((doc: Document) => doc.is_favorite);
    setDocumentsFavorite(favorites);

    await AsyncStorage.setItem('documents', JSON.stringify(data));
    await AsyncStorage.setItem('documentsFavorite', JSON.stringify(favorites));
  } catch (error) {
    console.error('Error listing documents:', error);
  }
};

export const listDocumentsFolder = async (filter: FilterFolder = {}) => {
  const setDocuments = useDocumentsStore.getState().setDocuments;

  const isOffline = await checkInternetConnection();
  if (isOffline) {
    const documentsOffline = await AsyncStorage.getItem('documents');
    if (documentsOffline) {
      setDocuments(JSON.parse(documentsOffline));
    }
    return;
  }

  try {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (filter.name) {
      query = query.ilike('name', `%${filter.name}%`);
    }

    if (filter.order) {
      filter.order.forEach((order) => {
        query = query.order(order.field, { ascending: order.type === 'asc' });
      });
    }

    if (filter.folder_id) {
      query = query.eq('folder_id', filter.folder_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    setDocuments(data);
    await AsyncStorage.setItem('documents', JSON.stringify(data));
  } catch (error) {
    console.error('Error listing folder documents:', error);
  }
};