import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';
import { getStudent } from '../storage/auth';

export default function HallCheckerScreen() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allocation, setAllocation] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    async function loadStudent() {
      const data = await getStudent();
      setStudent(data);
    }
    loadStudent();
  }, []);

  const checkHall = async () => {
    setLoading(true);
    setErrorInfo(null);
    setAllocation(null);
    try {
      const response = await api.get('/allocation');
      setAllocation(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        setErrorInfo({
          type: 'warning',
          message: error.response.data.error,
          details: error.response.data.message
        });
      } else if (error.response?.status === 404) {
        setErrorInfo({
          type: 'info',
          message: 'No upcoming exams',
          details: 'No allocation found for upcoming exams'
        });
      } else {
        setErrorInfo({
          type: 'error',
          message: 'Error',
          details: 'Failed to fetch allocation'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      
      {/* Student Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{student.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Roll No</Text>
          <Text style={styles.value}>{student.roll_no}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Department</Text>
          <Text style={styles.value}>{student.department}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Year</Text>
          <Text style={styles.value}>{student.year} Year {student.degree}</Text>
        </View>
      </View>

      {/* Action Section */}
      <View style={styles.actionSection}>
        {!allocation && (
          <TouchableOpacity style={styles.checkBtn} onPress={checkHall} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.checkBtnText}>Check My Hall</Text>}
          </TouchableOpacity>
        )}

        {errorInfo && errorInfo.type === 'warning' && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>{errorInfo.message}</Text>
            <Text style={styles.warningText}>{errorInfo.details}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={checkHall}>
              <Text style={styles.retryText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {errorInfo && errorInfo.type !== 'warning' && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{errorInfo.details}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={checkHall}>
              <Text style={styles.retryText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {allocation && (
          <View style={styles.resultCard}>
            <Text style={styles.resultHeading}>HALL DETAILS</Text>
            
            <View style={styles.resultRow}>
              <Text style={styles.resLabel}>Name:</Text>
              <Text style={styles.resValue}>{allocation.student?.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resLabel}>Roll No:</Text>
              <Text style={styles.resValue}>{allocation.student?.roll_no}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resLabel}>Department:</Text>
              <Text style={styles.resValue}>{allocation.student?.department}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resLabel}>Subject Code:</Text>
              <Text style={styles.resValue}>{allocation.subject_code}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resLabel}>Exam Date:</Text>
              <Text style={styles.resValue}>{allocation.exam_date}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resLabel}>Timing:</Text>
              <Text style={styles.resValue}>{allocation.time_from.substring(0, 5)} - {allocation.time_to.substring(0, 5)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resLabel}>Room No:</Text>
              <Text style={styles.resValueBold}>{allocation.room_no}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resLabel}>Seat No:</Text>
              <Text style={styles.resValueBold}>{allocation.seat_label}</Text>
            </View>

            <TouchableOpacity style={styles.refreshBtnInline} onPress={checkHall}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notes Box */}
      <View style={styles.notesBox}>
        <Text style={styles.notesTitle}>Important Instructions</Text>
        <Text style={styles.notesItem}>• Report to exam hall 15 minutes before exam time</Text>
        <Text style={styles.notesItem}>• Carry your college ID card</Text>
        <Text style={styles.notesItem}>• Carry your hall ticket</Text>
        <Text style={styles.notesItem}>• Electronic devices are not allowed</Text>
        <Text style={styles.notesItem}>• Check your seat number carefully before sitting</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  infoCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 100, color: '#4B5563', fontWeight: '500' },
  value: { flex: 1, color: '#1F2937', fontWeight: 'bold' },
  
  actionSection: { minHeight: 200, justifyContent: 'center', marginBottom: 24 },
  checkBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  checkBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  warningTitle: { color: '#D97706', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  warningText: { color: '#B45309', fontSize: 14, marginBottom: 12 },
  
  messageBox: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageText: { color: '#4B5563', fontSize: 14, marginBottom: 12 },
  
  retryBtn: { padding: 8, backgroundColor: '#E5E7EB', borderRadius: 4 },
  retryText: { color: '#374151', fontWeight: '600' },

  resultCard: {
    backgroundColor: 'white',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  resultHeading: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  resultRow: { flexDirection: 'row', marginBottom: 8 },
  resLabel: { width: 100, color: '#6B7280' },
  resValue: { flex: 1, color: '#1F2937', fontWeight: '500' },
  resValueBold: { flex: 1, color: '#2563EB', fontWeight: 'bold', fontSize: 16 },

  refreshBtnInline: { marginTop: 16, alignSelf: 'flex-end' },
  refreshBtnText: { color: '#2563EB', fontWeight: '600' },

  notesBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
  },
  notesTitle: { fontSize: 16, fontWeight: 'bold', color: '#92400E', marginBottom: 8 },
  notesItem: { color: '#92400E', fontSize: 14, marginBottom: 4 },
});
