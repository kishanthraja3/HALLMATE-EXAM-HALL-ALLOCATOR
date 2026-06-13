import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { getTeacher, clearAll } from '../storage/auth';

export default function AboutScreen({ navigation }) {
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await getTeacher();
      setTeacher(data);
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    await clearAll();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  if (!teacher) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Teacher Portal</Text>
        <Text style={styles.subtitle}>Rajalakshmi Engineering College</Text>
        <Text style={styles.desc}>Manage your exam duty assignments and request alterations through this portal.</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoCard}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{teacher.name}</Text>
        
        <Text style={[styles.label, { marginTop: 12 }]}>Teacher ID</Text>
        <Text style={styles.value}>{teacher.teacher_id}</Text>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { alignItems: 'center', paddingVertical: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#4B5563', marginTop: 4 },
  desc: { textAlign: 'center', color: '#6B7280', marginTop: 12, paddingHorizontal: 20 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  infoCard: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { color: '#6B7280', fontSize: 14 },
  value: { color: '#1F2937', fontSize: 18, fontWeight: '600', marginTop: 4 },
  logoutBtn: { borderWidth: 1, borderColor: '#DC2626', padding: 16, borderRadius: 8, alignItems: 'center' },
  logoutBtnText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, marginBottom: 40 }
});
