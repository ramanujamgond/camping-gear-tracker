import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ItemListScreen from '../screens/ItemListScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
