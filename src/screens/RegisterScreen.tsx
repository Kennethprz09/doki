import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../store/userStore';
import { useGlobalStore } from '../store/globalStore';
import { checkInternetConnection } from '../utils/actions';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/components/types';
import { supabase } from './src/supabase/supabaseClient';

interface User {
  id: string;
  email: string;
  name?: string;
  surname?: string;
  [key: string]: any;
}

interface RegisterScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useGlobalStore((state) => state.setLoading);

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    surname?: string;
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      name?: string;
      surname?: string;
      email?: string;
      password?: string;
    } = {};
    if (name.trim() === '') {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (surname.trim() === '') {
      newErrors.surname = 'El apellido es obligatorio';
    }
    if (email.trim() === '') {
      newErrors.email = 'El correo electrónico es obligatorio';
    }
    if (password.trim() === '') {
      newErrors.password = 'La contraseña es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    const isOffline = await checkInternetConnection();
    if (isOffline) {
      showToast('Sin conexión a internet.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Registrar usuario con Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            surname,
          },
        },
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      if (!user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Insertar perfil en la tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email || email,
            name,
            surname,
          },
        ]);

      if (profileError) {
        throw profileError;
      }

      // Almacenar datos del usuario y sesión
      const userData: User = {
        id: user.id,
        email: user.email || email,
        name,
        surname,
      };
      setUser(userData);
      await AsyncStorage.setItem('accessToken', data.session?.access_token || '');
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setLoading(false);
      navigation.navigate('MainRoutes');
    } catch (error: any) {
      let errorMessage = 'Error al registrarse. Por favor, inténtalo de nuevo.';
      if (error.message) {
        errorMessage = error.message;
      }
      showToast(errorMessage);
      setLoading(false);
    }
  };

  const showToast = (mensaje: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error al registrarse',
      text2: mensaje,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Image
          source={require('../../assets/logo/logoDark.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.label}>Crea tu cuenta</Text>
      </View>

      <View style={{ width: '100%' }}>
        <View style={styles.inputContainer}>
          <Ionicons
            name="person-circle-outline"
            size={20}
            color="#8293ac"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrors((prevErrors) => ({ ...prevErrors, name: '' }));
            }}
            placeholder="Nombre"
            autoCapitalize="none"
            placeholderTextColor="#a3a3a3"
          />
        </View>
        {errors.name && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.errorMessage}>{errors.name}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons
            name="person-circle-outline"
            size={20}
            color="#8293ac"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            value={surname}
            onChangeText={(text) => {
              setSurname(text);
              setErrors((prevErrors) => ({ ...prevErrors, surname: '' }));
            }}
            placeholder="Apellido"
            autoCapitalize="none"
            placeholderTextColor="#a3a3a3"
          />
        </View>
        {errors.surname && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.errorMessage}>{errors.surname}</Text>
          </View>
        )}

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
            placeholderTextColor="#a3a3a3"
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
            placeholderTextColor="#a3a3a3"
          />
        </View>
        {errors.password && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.errorMessage}>{errors.password}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
          }}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={{ fontFamily: 'Karla-SemiBold', color: '#ffffff' }}>
            Iniciar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'black',
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
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#ff8c00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
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
    backgroundColor: '#222222',
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
  iconRight: {
    marginRight: 10,
    position: 'absolute',
    right: 10,
    zIndex: 1,
  },
  icon: {
    marginRight: 10,
    color: '#a3a3a3',
  },
  errorMessage: {
    color: 'red',
    fontSize: 12,
  },
});

export default RegisterScreen;