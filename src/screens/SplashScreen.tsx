import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../components/types';
import { supabase } from '../supabase/supabaseClient';
import { syncUser } from '../utils/actions';

interface SplashScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const SplashScreen: React.FC<SplashScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authenticateUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncUser(); // Sincronizar datos del usuario
        navigation.navigate('MainRoutes');
      } else {
        navigation.navigate('Login');
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };

    authenticateUser();
  }, [isLoading, navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animatable.Image
          animation="fadeIn"
          duration={2900}
          source={require('../../assets/logo/logoDark.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 450,
    height: 250,
  },
});

export default SplashScreen;