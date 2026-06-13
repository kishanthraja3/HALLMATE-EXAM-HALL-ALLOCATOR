import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/LoginScreen';
import HallCheckerScreen from '../screens/HallCheckerScreen';
import TimetableScreen from '../screens/TimetableScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: 'white' },
        headerShown: true,
      }}
    >
      <Tab.Screen 
        name="HallChecker" 
        component={HallCheckerScreen} 
        options={{ title: 'Hall Checker', tabBarLabel: 'Hall Checker' }} 
      />
      <Tab.Screen 
        name="Timetable" 
        component={TimetableScreen} 
        options={{ title: 'Timetable' }} 
      />
      <Tab.Screen 
        name="About" 
        component={AboutScreen} 
        options={{ title: 'About' }} 
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ initialRoute }) {
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen 
        name="Auth" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Main" 
        component={MainNavigator} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}
