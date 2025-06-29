import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../supabase/supabaseClient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../components/types';

interface ForgotPasswordScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (email.trim() === '') {
      setError('El correo electrónico es obligatorio');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'com.app.doki://reset-password',
      });
      if (error) throw error;
      setMessage('Si la cuenta existe, se ha enviado un enlace de restablecimiento a tu correo.');
      setTimeout(() => navigation.navigate('Login'), 500);
    } catch (error: any) {
      setError(error.message || 'Error al enviar el enlace de restablecimiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'black' }}
      behavior={'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView style={{ flex: 1, backgroundColor: 'black' }} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.logo}>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.label}>Ingresa tu correo para recibir un enlace de restablecimiento</Text>
          </View>

          <View style={{ width: '100%' }}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#8293ac"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                placeholder="Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#cccccc"
              />
            </View>

            {error && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            )}

            {message && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.successMessage}>{message}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar Enlace'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ justifyContent: 'center', alignItems: 'center', marginTop: 20 }}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={{ fontFamily: 'Karla-SemiBold', color: '#ffffff' }}>
                Volver al inicio de sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'black',
  },
  container: {
    width: '100%',
  },
  logo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Karla-Bold',
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 10,
  },
  label: {
    fontFamily: 'Karla-Regular',
    color: '#ffffff',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    height: 50,
  },
  input: {
    flex: 1,
    fontFamily: 'Karla-Regular',
    height: '100%',
    color: '#ffffff',
  },
  icon: {
    marginRight: 10,
    color: '#cccccc',
  },
  button: {
    backgroundColor: '#ff8c00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Karla-Bold',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ff4d4d',
    fontSize: 12,
  },
  successMessage: {
    color: '#28a745',
    fontSize: 12,
  },
});

export default ForgotPasswordScreen;