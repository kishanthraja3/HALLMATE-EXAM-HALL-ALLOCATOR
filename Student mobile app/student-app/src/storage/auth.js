import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToken = async (token) => {
  await AsyncStorage.setItem('student_token', token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem('student_token');
};

export const saveStudent = async (student) => {
  await AsyncStorage.setItem('student_data', JSON.stringify(student));
};

export const getStudent = async () => {
  const data = await AsyncStorage.getItem('student_data');
  return data ? JSON.parse(data) : null;
};

export const clearAll = async () => {
  await AsyncStorage.removeItem('student_token');
  await AsyncStorage.removeItem('student_data');
};
