import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToken = async (token) => {
  await AsyncStorage.setItem('teacher_token', token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem('teacher_token');
};

export const saveTeacher = async (teacher) => {
  await AsyncStorage.setItem('teacher_data', JSON.stringify(teacher));
};

export const getTeacher = async () => {
  const data = await AsyncStorage.getItem('teacher_data');
  return data ? JSON.parse(data) : null;
};

export const clearAll = async () => {
  await AsyncStorage.removeItem('teacher_token');
  await AsyncStorage.removeItem('teacher_data');
};
