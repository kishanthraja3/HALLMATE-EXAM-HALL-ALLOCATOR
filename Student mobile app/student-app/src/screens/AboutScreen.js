import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';
import { getStudent, clearAll } from '../storage/auth';

export default function AboutScreen({ navigation }) {
  const [student, setStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStudent() {
      const data = await getStudent();
      setStudent(data);
    }
    loadStudent();
  }, []);

  const handleLogout = async () => {
    await clearAll();
    navigation.replace('Auth');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      Alert.alert('Success', 'Password changed successfully');
      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Student Portal</Text>
        <Text style={styles.collegeName}>Rajalakshmi Engineering College</Text>
        <Text style={styles.desc}>This app allows you to check your exam hall allocation and view your exam timetable.</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Information</Text>
        <Text style={styles.infoText}><Text style={styles.bold}>Name:</Text> {student.name}</Text>
        <Text style={styles.infoText}><Text style={styles.bold}>Roll No:</Text> {student.roll_no}</Text>
        <Text style={styles.infoText}><Text style={styles.bold}>Department:</Text> {student.department}</Text>
        <Text style={styles.infoText}><Text style={styles.bold}>Email:</Text> {student.email}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <TouchableOpacity style={styles.changePwdBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.changePwdText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{flex: 1}} />
      <Text style={styles.footer}>Version 1.0.0</Text>

      {/* Change Password Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  appName: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  collegeName: { fontSize: 16, color: '#4B5563', marginBottom: 8 },
  desc: { textAlign: 'center', color: '#6B7280', fontSize: 14 },
  
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  infoText: { fontSize: 15, color: '#4B5563', marginBottom: 6 },
  bold: { fontWeight: '600', color: '#1F2937' },
  
  changePwdBtn: { padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center' },
  changePwdText: { color: '#4B5563', fontWeight: '600' },
  
  logoutBtn: { padding: 12, borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: 'bold' },
  
  footer: { textAlign: 'center', color: '#9CA3AF', marginBottom: 10 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cancelBtn: { padding: 12, flex: 1, alignItems: 'center', marginRight: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  cancelText: { color: '#4B5563', fontWeight: '600' },
  submitBtn: { padding: 12, flex: 1, alignItems: 'center', marginLeft: 8, backgroundColor: '#2563EB', borderRadius: 8 },
  submitText: { color: 'white', fontWeight: 'bold' },
});
