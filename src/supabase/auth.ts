import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../store/userStore';

interface LoginResponse {
    success: boolean;
    errorMessage?: string;
    user?: any;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                errorMessage: error.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.',
            };
        }

        const { user, session } = data;

        // Store user data in Zustand
        useUserStore.getState().setUser(user);

        // Store user and token in AsyncStorage
        await AsyncStorage.setItem('accessToken', session?.access_token || '');
        await AsyncStorage.setItem('user', JSON.stringify(user));

        return {
            success: true,
            user,
        };
    } catch (err: any) {
        return {
            success: false,
            errorMessage: err.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.',
        };
    }
};

export const logout = async () => {
    try {
        await supabase.auth.signOut();
        useUserStore.getState().setUser(null);
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user');
    } catch (err) {
        console.error('Error al cerrar sesión:', err);
    }
};
