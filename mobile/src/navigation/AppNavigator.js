import { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { AuthContext, AuthProvider } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ItemListScreen from '../screens/ItemListScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import TripListScreen from '../screens/TripListScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import AddTripItemScreen from '../screens/AddTripItemScreen';

const Stack = createNativeStackNavigator();

function Navigation() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2e7d32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Camping Gear Tracker' }}
        />
        <Stack.Screen 
          name="Scanner" 
          component={ScannerScreen}
          options={{ title: 'Scan QR Code' }}
        />
        <Stack.Screen 
          name="ItemDetail" 
          component={ItemDetailScreen}
          options={{ title: 'Item Details' }}
        />
        <Stack.Screen 
          name="AddItem" 
          component={AddItemScreen}
          options={{ title: 'Add New Item' }}
        />
        <Stack.Screen 
          name="ItemList" 
          component={ItemListScreen}
          options={{ title: 'All Items' }}
        />
        <Stack.Screen 
          name="UserManagement" 
          component={UserManagementScreen}
          options={{ title: 'User Management' }}
        />
        <Stack.Screen 
          name="TripList" 
          component={TripListScreen}
          options={{ title: 'Trips' }}
        />
        <Stack.Screen 
          name="CreateTrip" 
          component={CreateTripScreen}
          options={{ title: 'Create Trip' }}
        />
        <Stack.Screen 
          name="TripDetail" 
          component={TripDetailScreen}
          options={{ title: 'Trip Details' }}
        />
        <Stack.Screen 
          name="AddTripItem" 
          component={AddTripItemScreen}
          options={{ title: 'Add Item to Trip' }}
        />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
