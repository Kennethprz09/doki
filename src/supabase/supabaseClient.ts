import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and Anon Key
const SUPABASE_URL = 'https://bqgztqlbcjtfembrjdkt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZ3p0cWxiY2p0ZmVtYnJqZGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MzM4ODQsImV4cCI6MjA2MTIwOTg4NH0.M98n_Th0Thc62zcLQ3e4Wil0tPun5KmOqYnO0xvh5qg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    storage: AsyncStorage,
  },
});

// Verificar sesión al iniciar y activar auto-refresh solo si es válida
supabase.auth.getSession().then(({ data, error }) => {
  if (error || !data.session) {
    // Token inválido o no hay sesión - limpiar silenciosamente
    supabase.auth.signOut().catch(() => {});
  } else {
    // Sesión válida - activar auto-refresh
    supabase.auth.startAutoRefresh();
  }
}).catch(() => {
  // Error inesperado - limpiar sesión
  supabase.auth.signOut().catch(() => {});
});

// Si en algún momento el refresh falla, limpiar sesión
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    supabase.auth.stopAutoRefresh();
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    supabase.auth.startAutoRefresh();
  }
});