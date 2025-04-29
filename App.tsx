import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import toastConfig from './src/components/Template/toastConfig';
import Loader from './src/components/Template/Loader';
import { useGlobalStore } from './src/store/globalStore';
import * as Font from 'expo-font';
import useNetInfo from './src/hook/useNetInfo';
import { useUserStore } from './src/store/userStore';
import { MainNavigator } from './src/navigation/BottomTap';
import { SafeAreaView } from 'react-native-safe-area-context';

const AppContent = () => {
  const isLoading = useGlobalStore((state) => state.loading);
  useNetInfo();

  const { loadUser } = useUserStore();

  useEffect(() => {
    // Cargar datos del usuario al iniciar la app
    loadUser();
  }, [loadUser]);

  return (
    <>
      {isLoading && <Loader />}
      <NavigationContainer>
        <MainNavigator />
        <Toast config={toastConfig} />
      </NavigationContainer>
    </>
  );
};

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Karla-Bold': require('./assets/fonts/Karla-Bold.ttf'),
        'Karla-Regular': require('./assets/fonts/Karla-Regular.ttf'),
        'Karla-SemiBold': require('./assets/fonts/Karla-SemiBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Render nothing until fonts are loaded
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar translucent={false} backgroundColor={'#ffffff'} barStyle={'dark-content'} />

      <AppContent />
    </SafeAreaView>
  );
};

export default App;