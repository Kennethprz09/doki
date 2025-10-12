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
import { useCameraPermissions } from 'expo-camera';

interface SplashScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const SplashScreen: React.FC<SplashScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useUserStore();
  const { setLoading } = useGlobalStore();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Función de autenticación que primero solicita permisos esenciales
  const authenticateUser = useCallback(async () => {
    try {

      // Paso 1: Solicitar permisos de cámara si no están concedidos
      if (!cameraPermission?.granted) {
        console.log('Solicitando permiso de cámara...');
        await requestCameraPermission();
      } else {
        console.log('Permiso de cámara ya concedido');
      }

      setLoading(true);

      // Paso 2: Continuar con la lógica de autenticación normal
      navigation.replace("Login");
      
    } catch (error) {
      console.error("Error durante la autenticación:", error);
      navigation.replace("Login");
    } finally {
      setLoading(false);
    }
  }, [navigation, user, setLoading, cameraPermission, requestCameraPermission]);

  useEffect(() => {
    const timer = setTimeout(authenticateUser, 1500);
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