import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useGlobalStore } from '../store/globalStore';
import { checkInternetConnection } from '../utils/actions';
import PrivacyPoliciesModal from '../components/PrivacyPoliciesModal';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../components/types';
import { login } from '../supabase/auth';

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const setLoading = useGlobalStore((state) => state.setLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (email.trim() === '') {
      newErrors.email = 'El correo electrónico es obligatorio';
    }
    if (password.trim() === '') {
      newErrors.password = 'La contraseña es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      showToast('Sin conexión a internet. Por favor, verifica tu conexión.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { success, errorMessage } = await login(email, password);

    setLoading(false);

    if (success) {
      navigation.navigate('MainRoutes');
    } else {
      showToast(errorMessage || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.');
    }
  };

  const showToast = (mensaje: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error al iniciar sesión',
      text2: mensaje,
    });
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
            <Image
              source={require('../../assets/logo/logoDark.png')}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.label}>Iniciar sesión en tu cuenta</Text>
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
                  setErrors((prevErrors) => ({ ...prevErrors, email: '' }));
                }}
                placeholder="Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#cccccc"
              />
            </View>

            {errors.email && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.errorMessage}>{errors.email}</Text>
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
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((prevErrors) => ({ ...prevErrors, password: '' }));
                }}
                placeholder="Contraseña"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#cccccc"
              />
            </View>

            {errors.password && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.errorMessage}>{errors.password}</Text>
              </View>
            )}

            <TouchableOpacity
              style={{ alignSelf: 'flex-end', marginBottom: 20 }}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={{ color: '#ffffff', fontFamily: 'Karla-SemiBold', fontSize: 14 }}>
                Olvidé mi contraseña
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
              }}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={{ fontFamily: 'Karla-SemiBold', color: '#ffffff' }}>
                Crear Cuenta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
              }}
              onPress={() => setPrivacyModalVisible(true)}
            >
              <Text style={{ fontFamily: 'Karla-SemiBold', color: '#ffffff' }}>
                Políticas de privacidad
              </Text>
            </TouchableOpacity>
          </View>

          <PrivacyPoliciesModal
            visible={isPrivacyModalVisible}
            onClose={() => setPrivacyModalVisible(false)}
          />
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
  iconContainer: {
    position: 'absolute',
    right: 10,
    backgroundColor: 'red',
  },
  labelTitle: {
    marginBottom: 5,
    fontSize: 25,
    fontFamily: 'Karla-Bold',
  },
  button: {
    backgroundColor: '#ff8c00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Karla-Bold',
    textAlign: 'center',
  },
  logo: {
    fontFamily: 'Karla-Bold',
    alignItems: 'center',
  },
  image: {
    width: 290,
    height: 190,
  },
  label: {
    fontFamily: 'Karla-Regular',
    color: '#ffffff',
    marginBottom: 15,
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
  errorMessage: {
    color: '#ff4d4d',
    fontSize: 12,
  },
});

export default LoginScreen;