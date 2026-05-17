import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { scale, verticalScale, moderateScale, rf } from "./src/utils/responsive";
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, useCallback } from 'react';
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { navigationRef } from "./src/utils/navigationRef";

import Home from "./src/screens/Home";
import Buy from "./src/screens/Buy";
import Sell from "./src/screens/Sell";
import Rent from "./src/screens/Rent";
import Profile from "./src/screens/Profile";
import Login from "./src/screens/Auth/Login";
import Signup from "./src/screens/Auth/Signup";
import RentABike from "./src/screens/RentABike";
import RentYourBike from "./src/screens/RentYourBike";
import MyListings from "./src/screens/MyListings";
import EditProfile from "./src/screens/EditProfile";
import Fav from "./src/screens/fav";
import AboutUs from "./src/screens/AboutUs";
import HelpSupport from "./src/screens/HelpSupport";
import Bookings from "./src/screens/Bookings";
import PremiumMembership from "./src/screens/PremiumMembership";
import { supabase } from "./src/supabase";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Disable system font scaling to prevent UI breaks across different phone font settings
if ((Text as any).defaultProps) {
  (Text as any).defaultProps.allowFontScaling = false;
  (Text as any).defaultProps.maxFontSizeMultiplier = 1;
} else {
  (Text as any).defaultProps = { allowFontScaling: false, maxFontSizeMultiplier: 1 };
}

if ((TextInput as any).defaultProps) {
  (TextInput as any).defaultProps.allowFontScaling = false;
  (TextInput as any).defaultProps.maxFontSizeMultiplier = 1;
} else {
  (TextInput as any).defaultProps = { allowFontScaling: false, maxFontSizeMultiplier: 1 };
}

console.log("Supabase loaded:", !!supabase);

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type AppStackParamList = {
  Tabs: undefined;
  RentABike: undefined;
  RentYourBike: undefined;
  MyListings: undefined;
  EditProfile: undefined;
  Fav: undefined;
  HelpSupport: undefined;
  AboutUs: undefined;
  Bookings: undefined;
  PremiumMembership: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator();

function Tabs() {
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="history"
      screenOptions={({ route }: any) => {
        const getIconName = (focused: boolean): keyof typeof Ionicons.glyphMap => {
          if (route.name === "Home") return focused ? "home" : "home-outline";
          if (route.name === "Buy") return focused ? "cart" : "cart-outline";
          if (route.name === "Sell") return focused ? "cash" : "cash-outline";
          if (route.name === "Rent") return focused ? "key" : "key-outline";
          if (route.name === "Profile") return focused ? "person" : "person-outline";
          return "home-outline";
        };

        return {
          headerShown: false,
          tabBarIcon: ({ color, focused }: any) => {
            const isHome = route.name === "Home";

            if (isHome) {
              return (
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16, // Modern squircle shape
                  backgroundColor: "#e53935",
                  alignItems: "center",
                  justifyContent: "center",
                  elevation: 10,
                  shadowColor: "#e53935",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                }}>
                  {/* Subtle inner highlight for modern depth */}
                  <View style={{
                    position: "absolute",
                    top: 2,
                    width: "80%",
                    height: "40%",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }} />
                  <Ionicons name="home" size={26} color="#fff" />
                </View>
              );
            }

            return (
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <View style={{
                  position: "absolute",
                  top: -5,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: focused ? "#e5393515" : "transparent",
                }} />
                <Ionicons name={getIconName(focused)} size={24} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: "#e53935",
          tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: isDark ? "#1F2937" : "#ffffff",
            borderTopWidth: 0,
            elevation: 25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: moderateScale(12),
            height: verticalScale(70),
            paddingBottom: verticalScale(8),
            paddingTop: verticalScale(8),
            borderTopLeftRadius: moderateScale(32),
            borderTopRightRadius: moderateScale(32),
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
          },
          tabBarLabelStyle: {
            fontSize: rf(10),
            fontWeight: "800",
            marginTop: 0,
            marginBottom: verticalScale(4),
          },
        };
      }}
    >
      <Tab.Screen name="Buy" component={Buy} />
      <Tab.Screen name="Sell" component={Sell} />
      <Tab.Screen name="Home" component={Home} options={{ tabBarLabel: "" }} />
      <Tab.Screen name="Rent" component={Rent} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  const linking = {
    prefixes: ["expo://", "wheelx://"],
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={isDark ? DarkTheme : DefaultTheme}
      linking={linking}
    >
      {isAuthenticated ? (
        <AppStack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            animationDuration: 350,
          }}
        >
          <AppStack.Screen name="Tabs" component={Tabs} />
          <AppStack.Screen name="RentABike" component={RentABike} />
          <AppStack.Screen name="RentYourBike" component={RentYourBike} />
          <AppStack.Screen name="MyListings" component={MyListings} />
          <AppStack.Screen name="EditProfile" component={EditProfile} />
          <AppStack.Screen name="Fav" component={Fav} />
          <AppStack.Screen name="HelpSupport" component={HelpSupport} />
          <AppStack.Screen name="AboutUs" component={AboutUs} />
          <AppStack.Screen name="Bookings" component={Bookings} />
          <AppStack.Screen name="PremiumMembership" component={PremiumMembership} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_bottom",
            animationDuration: 400,
          }}
        >
          <AuthStack.Screen name="Login">
            {(props: any) => <Login onSignup={() => props.navigation.navigate("Signup")} />}
          </AuthStack.Screen>
          <AuthStack.Screen name="Signup">
            {(props: any) => <Signup onLogin={() => props.navigation.navigate("Login")} />}
          </AuthStack.Screen>
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}


export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Artificially delay for 1.5 seconds as requested
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately!
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <ThemeProvider>
              <AppNavigator />
            </ThemeProvider>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </View>
  );
}
