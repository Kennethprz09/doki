import React from "react";
import { useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../components/types";
import { useUserStore } from "../store/userStore";
import { useGlobalStore } from "../store/globalStore";
import { useCameraPermissions } from "expo-camera";

interface SplashScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const SplashScreen: React.FC<SplashScreenProps> = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useUserStore();
  const { setLoading } = useGlobalStore();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const authenticateUser = useCallback(async () => {
    try {
      // Paso 1: Solicitar permisos de cámara si no están concedidos
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
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
    <View style={styles.container}>
      <Animated.Image
        source={require("../../assets/logo/logoDark.png")}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
        accessibilityLabel="Logo de la aplicación"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  logo: {
    width: 240,
    height: 207,
  },
});

export default SplashScreen;
