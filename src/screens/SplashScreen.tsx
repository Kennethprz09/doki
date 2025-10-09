"use client";

import React from "react";
import { useEffect, useCallback } from "react";
import { View, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../components/types";
import { useUserStore } from "../store/userStore";
import { useGlobalStore } from "../store/globalStore";

interface SplashScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

// Optimización 1: Componente más robusto con mejor manejo de autenticación
const SplashScreen: React.FC<SplashScreenProps> = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useUserStore();
  const { setLoading } = useGlobalStore();

  // Optimización 2: Función de autenticación mejorada
  const authenticateUser = useCallback(async () => {
    try {
      setLoading(true);

      navigation.replace("Login");
    } catch (error) {
      console.error("Error during authentication:", error);
      navigation.replace("Login");
    } finally {
      setLoading(false);
    }
  }, [navigation, user, setLoading]);

  useEffect(() => {
    // Optimización 3: Delay mínimo para mostrar splash screen
    const timer = setTimeout(authenticateUser, 2000);
    return () => clearTimeout(timer);
  }, [authenticateUser]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/logo/logoDark.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo de la aplicación"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 450,
    height: 250,
  },
});

export default SplashScreen;
