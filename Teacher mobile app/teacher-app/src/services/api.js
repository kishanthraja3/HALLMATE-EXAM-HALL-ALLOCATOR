import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const ipAddress = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const BASE_URL = `http://${ipAddress}:3000/api/teacher`;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('teacher_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
