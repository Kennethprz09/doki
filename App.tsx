import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import toastConfig from "./src/components/Template/toastConfig";
import Loader from "./src/components/Template/Loader";
import { useGlobalStore } from "./src/store/globalStore";
import * as Font from "expo-font";
import useNetInfo from "./src/hooks/useNetInfo";
import { useUserStore } from "./src/store/userStore";
import { MainNavigator } from "./src/navigation/BottomTap";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import useDocumentsSync from "./src/hooks/useDocumentsSync";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SupabaseSubscriptionProvider } from "./src/contexts/SupabaseSubscriptionContext";

SplashScreen.preventAutoHideAsync();

const AppContent = () => {
  const isLoading = useGlobalStore((state) => state.loading);
  useNetInfo();
  useDocumentsSync();

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
      try {
        await Font.loadAsync({
          "Karla-Bold": require("./assets/fonts/Karla-Bold.ttf"),
          "Karla-Regular": require("./assets/fonts/Karla-Regular.ttf"),
          "Karla-SemiBold": require("./assets/fonts/Karla-SemiBold.ttf"),
        });
      } catch (error) {
        console.error("Error loading fonts:", error);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "black" }}
        edges={["top", "bottom"]}
      >
        <StatusBar
          translucent={true}
          backgroundColor={"transparent"}
          barStyle={"dark-content"}
        />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SupabaseSubscriptionProvider>
            <AppContent />
          </SupabaseSubscriptionProvider>
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;
