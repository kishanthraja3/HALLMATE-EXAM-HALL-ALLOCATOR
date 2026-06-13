import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/LoginScreen';
import HallCheckerScreen from '../screens/HallCheckerScreen';
import RequestAlterationScreen from '../screens/RequestAlterationScreen';
import AlterationHistoryScreen from '../screens/AlterationHistoryScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center', tabBarLabelPosition: 'below-icon' }}>
      <Tab.Screen name="Hall Checker" component={HallCheckerScreen} />
      <Tab.Screen name="History" component={AlterationHistoryScreen} />
      <Tab.Screen name="About" component={AboutScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ initialRoute }) {
  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="RequestAlteration" component={RequestAlterationScreen} options={{ headerShown: true, title: 'Request Alteration' }} />
    </Stack.Navigator>
  );
}
