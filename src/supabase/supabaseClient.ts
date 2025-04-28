import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and Anon Key
const SUPABASE_URL = 'https://bqgztqlbcjtfembrjdkt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZ3p0cWxiY2p0ZmVtYnJqZGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MzM4ODQsImV4cCI6MjA2MTIwOTg4NH0.M98n_Th0Thc62zcLQ3e4Wil0tPun5KmOqYnO0xvh5qg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: AsyncStorage,
  },
});