import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { getToken } from './src/storage/auth';

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        if (token) {
          setInitialRoute('Main');
        } else {
          setInitialRoute('Auth');
        }
      } catch (error) {
        console.error("AsyncStorage error: ", error);
        setInitialRoute('Auth'); // Fallback to login on error
      }
    }
    checkAuth();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator initialRoute={initialRoute} />
    </NavigationContainer>
  );
}
