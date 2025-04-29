import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransitionPresets } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import HighlightsScreen from '../screens/HighlightsScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OpenFolderScreen from '../screens/OpenFolderScreen';
import MyAccountScreen from '../screens/MyAccountScreen';
import { RootStackParamList } from 'src/components/types';


const Tab = createBottomTabNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

export const MainNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainRoutes"
        component={BottomTab}
        options={{ headerShown: false }}
      />
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
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Highlights') {
            iconName = focused ? 'star' : 'star-outline';
          } else {
            iconName = 'help';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: 'Karla-Bold',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 10,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Inicio',
          initialRouteName: 'Home',
        }}
      />
      <Tab.Screen
        name="Highlights"
        component={HighlightsStackScreen}
        options={{
          tabBarLabel: 'Destacado',
        }}
      />
    </Tab.Navigator>
  );
};

const HomeStack = createNativeStackNavigator<RootStackParamList>();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        options={{
          headerShown: false,
          ...TransitionPresets.SlideFromRightIOS,
          animation: 'slide_from_right',
          title: 'Home',
          headerTitleAlign: 'center',
          headerTitleStyle: styles.headerTitleStyle,
        }}
        name="HomePage"
        component={HomeScreen}
      />
      <HomeStack.Screen
        options={{
          headerShown: false,
          ...TransitionPresets.SlideFromRightIOS,
          animation: 'slide_from_right',
          title: 'Abrir Carpeta',
          headerTitleAlign: 'center',
          headerTitleStyle: styles.headerTitleStyle,
        }}
        name="OpenFolderPage"
        component={OpenFolderScreen}
      />
      <HomeStack.Screen
        options={{
          headerShown: false,
          ...TransitionPresets.SlideFromRightIOS,
          animation: 'slide_from_right',
          title: 'Mi cuenta',
          headerTitleAlign: 'center',
          headerTitleStyle: styles.headerTitleStyle,
        }}
        name="MyAccountPage"
        component={MyAccountScreen}
      />
    </HomeStack.Navigator>
  );
}

const HighlightsStack = createNativeStackNavigator<RootStackParamList>();
function HighlightsStackScreen() {
  return (
    <HighlightsStack.Navigator>
      <HighlightsStack.Screen
        options={{
          headerShown: false,
          ...TransitionPresets.SlideFromRightIOS,
          animation: 'slide_from_right',
          title: 'Highlights',
          headerTitleAlign: 'center',
          headerTitleStyle: styles.headerTitleStyle,
        }}
        name="HighlightsPage"
        component={HighlightsScreen}
      />
      <HighlightsStack.Screen
        options={{
          headerShown: false,
          ...TransitionPresets.SlideFromRightIOS,
          animation: 'slide_from_right',
          title: 'Abrir Carpeta',
          headerTitleAlign: 'center',
          headerTitleStyle: styles.headerTitleStyle,
        }}
        name="OpenFolderPage"
        component={OpenFolderScreen}
      />
    </HighlightsStack.Navigator>
  );
}

const styles = StyleSheet.create({
  notificationButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 10,
    elevation: 5,
  },
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '700',
  },
});