import React, { useState, useEffect } from 'react';
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

interface ResetPasswordScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('No se detectó una sesión válida. Por favor, usa el enlace de restablecimiento.');
        setTimeout(() => navigation.navigate('Login'), 3000);
      }
    };
    checkSession();
  }, [navigation]);

  const validateForm = () => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};
    if (newPassword.trim() === '') {
      newErrors.newPassword = 'La nueva contraseña es obligatoria';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (confirmPassword.trim() === '') {
      newErrors.confirmPassword = 'Debes confirmar la contraseña';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdatePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('Contraseña actualizada con éxito. Redirigiendo al inicio de sesión...');
      setTimeout(() => navigation.navigate('Login'), 3000);
    } catch (error: any) {
      setErrors({ newPassword: error.message || 'Error al actualizar la contraseña.' });
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
            <Text style={styles.title}>Restablecer Contraseña</Text>
            <Text style={styles.label}>Ingresa tu nueva contraseña</Text>
          </View>

          <View style={{ width: '100%' }}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#8293ac"
                style={styles.icon}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.iconRight}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8293ac"
                />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setErrors((prev) => ({ ...prev, newPassword: '' }));
                }}
                placeholder="Nueva contraseña"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#cccccc"
              />
            </View>

            {errors.newPassword && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.errorMessage}>{errors.newPassword}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#8293ac"
                style={styles.icon}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.iconRight}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8293ac"
                />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder="Confirmar contraseña"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                placeholderTextColor="#cccccc"
              />
            </View>

            {errors.confirmPassword && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.errorMessage}>{errors.confirmPassword}</Text>
              </View>
            )}

            {message && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.successMessage}>{message}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Actualizando...' : 'Actualizar Contraseña'}</Text>
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
  iconRight: {
    marginRight: 10,
    position: 'absolute',
    right: 10,
    zIndex: 1,
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

export default ResetPasswordScreen;