import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';

// Magically detect the exact IP address Expo is using for your phone!
const debuggerHost = Constants.expoConfig?.hostUri;
const ipAddress = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const BASE_URL = `http://${ipAddress}:3000/api/student`;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('student_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
