import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name?: string;
  surname?: string;
  email?: string;
  [key: string]: any;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  loadUser: () => Promise<void>;
  clearUser: () => Promise<void>;
}

// Clave para AsyncStorage
const USER_STORAGE_KEY = '@user_data';

// Inicializar el store con datos de AsyncStorage
const initializeUser = async (): Promise<User | null> => {
  try {
    const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error al cargar usuario desde AsyncStorage:', error);
    return null;
  }
};

export const useUserStore = create<UserState>((set) => ({
  user: null, // Inicialmente null, se cargará con loadUser
  setUser: (user) => {
    set({ user });
    // Guardar en AsyncStorage
    if (user) {
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)).catch((error) =>
        console.error('Error al guardar usuario en AsyncStorage:', error)
      );
    } else {
      AsyncStorage.removeItem(USER_STORAGE_KEY).catch((error) =>
        console.error('Error al eliminar usuario de AsyncStorage:', error)
      );
    }
  },
  loadUser: async () => {
    const storedUser = await initializeUser();
    if (storedUser) {
      set({ user: storedUser });
    }
  },
  clearUser: async () => {
    set({ user: null });
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  },
}));