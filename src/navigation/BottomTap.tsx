import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import HighlightsScreen from "../screens/HighlightsScreen";
import RegisterScreen from "../screens/RegisterScreen";
import OpenFolderScreen from "../screens/OpenFolderScreen";
import MyAccountScreen from "../screens/MyAccountScreen";
import { RootStackParamList } from "../components/types";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import { colors, fonts } from "../theme";

const Tab = createBottomTabNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

export const MainNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MainRoutes" component={BottomTab} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export const BottomTab = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Highlights") {
            iconName = focused ? "star" : "star-outline";
          } else if (route.name === "Cuenta") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "help";
          }
          return (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
              <Ionicons name={iconName as any} size={22} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 11,
          marginTop: -2,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          height: Platform.OS === "ios" ? 85 : 68,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{ tabBarLabel: "Inicio" }}
      />
      <Tab.Screen
        name="Highlights"
        component={HighlightsStackScreen}
        options={{ tabBarLabel: "Favoritos" }}
      />
      <Tab.Screen
        name="Cuenta"
        component={CuentaStackScreen}
        options={{ tabBarLabel: "Cuenta" }}
      />
    </Tab.Navigator>
  );
};

// ─── Home Stack ──────────────────────────────────────────────────────────────
const HomeStack = createNativeStackNavigator<RootStackParamList>();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomePage"
        component={HomeScreen}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <HomeStack.Screen
        name="OpenFolderPage"
        component={OpenFolderScreen}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <HomeStack.Screen
        name="MyAccountPage"
        component={MyAccountScreen}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </HomeStack.Navigator>
  );
}

// ─── Highlights Stack ─────────────────────────────────────────────────────────
const HighlightsStack = createNativeStackNavigator<RootStackParamList>();
function HighlightsStackScreen() {
  return (
    <HighlightsStack.Navigator>
      <HighlightsStack.Screen
        name="HighlightsPage"
        component={HighlightsScreen}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <HighlightsStack.Screen
        name="OpenFolderPage"
        component={OpenFolderScreen}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <HighlightsStack.Screen
        name="MyAccountPage"
        component={MyAccountScreen}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </HighlightsStack.Navigator>
  );
}

// ─── Cuenta Stack ─────────────────────────────────────────────────────────────
const CuentaStack = createNativeStackNavigator<RootStackParamList>();
function CuentaStackScreen() {
  return (
    <CuentaStack.Navigator>
      <CuentaStack.Screen
        name="CuentaPage"
        component={MyAccountScreen}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </CuentaStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    width: 36,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  tabIconWrapperActive: {
    backgroundColor: colors.primarySubtle,
  },
});
