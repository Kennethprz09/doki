import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store/userStore';
import { useGlobalStore } from '../store/globalStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../components/types';
import { supabase } from '../supabase/supabaseClient';

const MyAccountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const { loading, setLoading } = useGlobalStore();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFieldVisible, setIsPasswordFieldVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const passwordFieldHeight = useState(new Animated.Value(0))[0];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (name.trim() === '') {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (surname.trim() === '') {
      newErrors.surname = 'El apellido es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }

    setLoading(true);

    try {
      const displayName = `${name.trim()} ${surname.trim()}`.trim();
      const authUpdate = {
        data: {
          display_name: displayName,
          name: name.trim(),
          surname: surname.trim(),
        },
      };

      if (password.trim()) {
        authUpdate.password = password;
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdate);
      if (authError) {
        throw new Error(`Error al actualizar autenticación: ${authError.message}`);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            name: name.trim(),
            surname: surname.trim(),
            email: user.email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        throw new Error(`Error al actualizar perfil: ${profileError.message}`);
      }

      setUser({
        ...user,
        email: user.email,
        user_metadata: {
          ...user.user_metadata,
          name: name.trim(),
          surname: surname.trim(),
          display_name: displayName,
        },
      });

      Alert.alert('Éxito', 'Cambios guardados correctamente.');
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', error.message || 'No se pudieron guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const togglePasswordField = () => {
    if (isPasswordFieldVisible) {
      setPassword('');
    }
    setIsPasswordFieldVisible((prev) => !prev);

    Animated.timing(passwordFieldHeight, {
      toValue: isPasswordFieldVisible ? 0 : 60,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || '');
      setSurname(user.user_metadata?.surname || '');
      setEmail(user.email || '');
      console.log('User data loaded:', user);
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Mi cuenta</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="person-outline"
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
          onBlur={validateForm}
          placeholder="Nombre"
          autoCapitalize="none"
          placeholderTextColor="#a3a3a3"
          accessibilityLabel="Nombre"
        />
      </View>
      {errors.name && <Text style={styles.errorMessage}>{errors.name}</Text>}

      <View style={styles.inputContainer}>
        <Ionicons
          name="person-outline"
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
          onBlur={validateForm}
          placeholder="Apellido"
          autoCapitalize="none"
          placeholderTextColor="#a3a3a3"
          accessibilityLabel="Apellido"
        />
      </View>
      {errors.surname && <Text style={styles.errorMessage}>{errors.surname}</Text>}

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#8293ac" style={styles.icon} />
        <TextInput
          style={styles.inputDisabled}
          value={email}
          editable={false}
          selectTextOnFocus={false}
          accessibilityLabel="Correo electrónico (solo lectura)"
        />
      </View>

      <TouchableOpacity onPress={togglePasswordField} style={styles.changePasswordLink}>
        <Text style={styles.changePasswordText}>Cambiar Contraseña</Text>
      </TouchableOpacity>

      {isPasswordFieldVisible && (
        <Animated.View style={[styles.inputContainer, { height: passwordFieldHeight }]}>
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
            onChangeText={setPassword}
            placeholder="Nueva Contraseña"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            placeholderTextColor="#a3a3a3"
            accessibilityLabel="Nueva contraseña"
          />
        </Animated.View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSaveChanges}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Guardar Cambios</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Karla-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fd',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Karla-Regular',
    height: 50,
    color: 'black',
  },
  inputDisabled: {
    flex: 1,
    fontFamily: 'Karla-Regular',
    height: 50,
    color: 'black',
    opacity: 0.5,
  },
  icon: {
    marginRight: 10,
  },
  button: {
    backgroundColor: '#ff8c00',
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 20,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ffa733',
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Karla-Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  iconRight: {
    marginRight: 10,
    position: 'absolute',
    right: 10,
    zIndex: 1,
  },
  changePasswordLink: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  changePasswordText: {
    color: '#ff8c00',
    fontSize: 16,
    fontFamily: 'Karla-Regular',
  },
});

export default MyAccountScreen;