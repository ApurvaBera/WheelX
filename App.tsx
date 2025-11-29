import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Home from './src/screens/Home';
import Buy from './src/screens/Buy';
import Sell from './src/screens/Sell';
import Rent from './src/screens/Rent';
import Profile from './src/screens/Profile';
import BikeDetails from './src/screens/BikeDetails';
import Login from './src/screens/Auth/Login';
import Signup from './src/screens/Auth/Signup';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type AppStackParamList = {
  Tabs: undefined;
  BikeDetails: { bikeId?: string } | undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const getIconName = (): keyof typeof Ionicons.glyphMap => {
          if (route.name === 'Home') return 'home-outline';
          if (route.name === 'Buy') return 'cart-outline';
          if (route.name === 'Sell') return 'cash-outline';
          if (route.name === 'Rent') return 'key-outline';
          if (route.name === 'Profile') return 'person-outline';
          return 'home-outline';
        };

        return {
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={getIconName()} size={size} color={color} />
          ),
          tabBarActiveTintColor: '#e53935',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            height: 64, // slightly taller
            marginBottom: 8, // <== shifted a bit up
            paddingBottom: 8,
            paddingTop: 8,
            borderRadius: 20, // optional for rounded corners effect
            position: 'absolute', // makes it float slightly above
            left: 10,
            right: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
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

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AppStack.Navigator>
          <AppStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <AppStack.Screen
            name="BikeDetails"
            component={BikeDetails}
            options={{ title: 'Bike Details' }}
          />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator initialRouteName="Login">
          <AuthStack.Screen name="Login" options={{ headerShown: false }}>
            {(props) => (
              <Login onSignup={() => props.navigation.navigate('Signup')} />
            )}
          </AuthStack.Screen>
          <AuthStack.Screen name="Signup" options={{ headerShown: false }}>
            {(props) => (
              <Signup onLogin={() => props.navigation.navigate('Login')} />
            )}
          </AuthStack.Screen>
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
