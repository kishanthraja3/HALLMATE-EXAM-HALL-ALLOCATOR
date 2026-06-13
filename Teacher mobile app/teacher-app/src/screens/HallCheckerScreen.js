import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import api from '../services/api';
import { getTeacher } from '../storage/auth';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function HallCheckerScreen({ navigation }) {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [duty, setDuty] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await getTeacher();
      setTeacher(data);
    }
    loadData();
  }, []);

  const checkHall = async () => {
    setLoading(true);
    setErrorInfo(null);
    setDuty(null);
    try {
      const response = await api.get('/duty');
      setDuty(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setErrorInfo({
          type: 'info',
          message: 'No upcoming duties',
          details: 'No upcoming exam duty assigned to you'
        });
      } else {
        setErrorInfo({
          type: 'error',
          message: 'Error',
          details: 'Failed to fetch duty'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!duty) return;
    try {
      const response = await api.get(`/duty/download?session_id=${duty.session_id}&room_no=${duty.room_no}`);
      const csvStr = response.data;
      
      const fileUri = `${FileSystem.documentDirectory}room_${duty.room_no}_students.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvStr);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Download Student List', UTI: 'public.comma-separated-values' });
      } else {
        Alert.alert('Error', 'Sharing not available on this device');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to download student list.');
    }
  };

  if (!teacher) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      
      {/* Teacher Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{teacher.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Teacher ID</Text>
          <Text style={styles.value}>{teacher.teacher_id}</Text>
        </View>
      </View>

      {/* Action Section */}
      <View style={styles.actionSection}>
        {!duty && !errorInfo && (
          <TouchableOpacity style={styles.checkBtn} onPress={checkHall} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.checkBtnText}>Check My Hall</Text>}
          </TouchableOpacity>
        )}

        {errorInfo && (
          <View style={styles.messageBox}>
            <Text style={styles.messageTitle}>{errorInfo.message}</Text>
            <Text style={styles.messageText}>{errorInfo.details}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={checkHall}>
              <Text style={styles.retryText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Duty Result Card */}
        {duty && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>UPCOMING EXAM DUTY</Text>
            <View style={styles.resultDivider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Room No:</Text>
              <Text style={styles.detailValueHighlight}>{duty.room_no}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{duty.exam_date}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>{duty.time_from} - {duty.time_to}</Text>
            </View>
            
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                <Text style={styles.downloadText}>Download CSV</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.recheckBtn} onPress={checkHall}>
              <Text style={styles.recheckText}>Check Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* SECTION 4: Notes */}
      <View style={styles.notesBox}>
        <Text style={styles.notesTitle}>Duty Instructions</Text>
        <Text style={styles.noteItem}>• Report to assigned room 30 minutes before exam</Text>
        <Text style={styles.noteItem}>• Carry your college ID</Text>
        <Text style={styles.noteItem}>• Ensure students are seated correctly</Text>
        <Text style={styles.noteItem}>• Do not leave the hall unattended</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  infoCard: { backgroundColor: '#E0F2FE', padding: 20, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#BAE6FD' },
  row: { flexDirection: 'row', marginBottom: 12 },
  label: { width: 100, color: '#0369A1', fontWeight: '600', fontSize: 16 },
  value: { flex: 1, color: '#0C4A6E', fontWeight: 'bold', fontSize: 16 },
  
  actionSection: { minHeight: 150, justifyContent: 'center' },
  checkBtn: { backgroundColor: '#2563EB', paddingVertical: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  checkBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  
  messageBox: { backgroundColor: 'white', padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  messageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  messageText: { color: '#6B7280', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#4B5563', fontWeight: 'bold', fontSize: 16 },
  
  resultCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  resultTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', letterSpacing: 1 },
  resultDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  detailRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  detailLabel: { width: 100, fontSize: 16, color: '#6B7280', fontWeight: '500' },
  detailValue: { flex: 1, fontSize: 18, color: '#1F2937', fontWeight: 'bold' },
  detailValueHighlight: { flex: 1, fontSize: 24, color: '#2563EB', fontWeight: '900' },
  
  actionsRow: { marginTop: 10, marginBottom: 20 },
  downloadBtn: { backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'center' },
  downloadText: { color: '#1D4ED8', fontWeight: 'bold', fontSize: 16 },
  
  recheckBtn: { alignItems: 'center', marginTop: 10 },
  recheckText: { color: '#6B7280', fontWeight: '600', textDecorationLine: 'underline' },
  
  notesBox: { backgroundColor: '#FEF3C7', padding: 16, borderRadius: 8, marginTop: 32, marginBottom: 40, borderWidth: 1, borderColor: '#FDE68A' },
  notesTitle: { color: '#92400E', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  noteItem: { color: '#92400E', fontSize: 14, marginBottom: 4 }
});
