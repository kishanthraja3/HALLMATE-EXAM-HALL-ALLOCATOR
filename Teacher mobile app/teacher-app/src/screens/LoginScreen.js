import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../services/api';
import { saveToken, saveTeacher } from '../storage/auth';

export default function LoginScreen({ navigation }) {
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!teacherId || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.post('/login', { teacher_id: teacherId.trim(), password: password.trim() });
      await saveToken(response.data.token);
      await saveTeacher(response.data.teacher);
      navigation.replace('Main');
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.error || 'Invalid Teacher ID or password');
      } else {
        setErrorMsg('Network Error: Cannot reach backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <Text style={styles.title}>Teacher Portal</Text>
        <Text style={styles.subtitle}>Rajalakshmi Engineering College</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Teacher ID (e.g. T001)"
          autoCapitalize="characters"
          autoCorrect={false}
          value={teacherId}
          onChangeText={setTeacherId}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: 'white', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#DC2626', textAlign: 'center', marginBottom: 12 }
});
