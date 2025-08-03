import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../store/userStore';

interface LoginResponse {
    success: boolean;
    errorMessage?: string;
    user?: any;
}

interface ResetPasswordResponse {
    success: boolean;
    message?: string;
    errorMessage?: string;
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

export const resetPassword = async (email: string): Promise<ResetPasswordResponse> => {
  try {
    // Validar el correo electrónico
    if (!email) {
      return {
        success: false,
        errorMessage: 'El correo electrónico es obligatorio',
      };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        errorMessage: 'Por favor, ingresa un correo electrónico válido',
      };
    }

    // Llamar a la función de borde usando supabase.functions.invoke
    const { data, error } = await supabase.functions.invoke('reset-password', {
      body: { email },
    });

    if (error) {
      return {
        success: false,
        errorMessage: error.message || 'Error al procesar la solicitud de restablecimiento',
      };
    }

    return {
      success: true,
      message: data.message || 'Se ha enviado una nueva contraseña a tu correo',
    };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err.message || 'Error al enviar la nueva contraseña',
    };
  }
};