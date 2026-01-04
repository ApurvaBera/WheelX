import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

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
import { supabase } from "./src/supabase";

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
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator();

function Tabs() {
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => {
        const getIconName = (): keyof typeof Ionicons.glyphMap => {
          if (route.name === "Home") return "home-outline";
          if (route.name === "Buy") return "cart-outline";
          if (route.name === "Sell") return "cash-outline";
          if (route.name === "Rent") return "key-outline";
          if (route.name === "Profile") return "person-outline";
          return "home-outline";
        };

        return {
          headerShown: false,
          tabBarIcon: ({ color, size }: any) => (
            <Ionicons name={getIconName()} size={size} color={color} />
          ),
          tabBarActiveTintColor: "#e53935",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: {
            backgroundColor: isDark ? "#1F2937" : "#ffffff",
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            height: 64,
            marginBottom: 8,
            paddingBottom: 8,
            paddingTop: 8,
            borderRadius: 20,
            position: "absolute",
            left: 10,
            right: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
        };
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Buy" component={Buy} />
      <Tab.Screen name="Sell" component={Sell} />
      <Tab.Screen name="Rent" component={Rent} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  const linking = {
    prefixes: ["expo://"],
  };

  return (
    <NavigationContainer
      theme={isDark ? DarkTheme : DefaultTheme}
      linking={linking}
    >
      {isAuthenticated ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="Tabs" component={Tabs} />
          <AppStack.Screen name="RentABike" component={RentABike} />
          <AppStack.Screen name="RentYourBike" component={RentYourBike} />
          <AppStack.Screen name="MyListings" component={MyListings} />
          <AppStack.Screen name="EditProfile" component={EditProfile} />
          <AppStack.Screen name="Fav" component={Fav} />
          <AppStack.Screen name="HelpSupport" component={HelpSupport} />
          <AppStack.Screen name="AboutUs" component={AboutUs} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
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
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
