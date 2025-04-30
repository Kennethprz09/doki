import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { supabase } from '../supabase/supabaseClient';

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
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error syncing user:', error);
      return;
    }

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

    await AsyncStorage.setItem('user', JSON.stringify(data));
  } catch (error) {
    console.error('Error syncing user:', error);
  }
};