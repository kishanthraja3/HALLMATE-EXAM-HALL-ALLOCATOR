import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import api from '../services/api';

export default function RequestAlterationScreen({ navigation }) {
  const [duty, setDuty] = useState(null);
  const [fetchingDuty, setFetchingDuty] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [reason, setReason] = useState('');
  const [suggestedAlt, setSuggestedAlt] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadDuty() {
      try {
        const response = await api.get('/duty');
        setDuty(response.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setFetchError('You do not have any upcoming duties to request an alteration for.');
        } else {
          setFetchError('Failed to fetch upcoming duty details.');
        }
      } finally {
        setFetchingDuty(false);
      }
    }
    loadDuty();
  }, []);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setErrorMsg('Reason is required');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      await api.post('/alteration', {
        session_id: duty.session_id, 
        room_no: duty.room_no, 
        exam_date: duty.exam_date, 
        time_from: duty.time_from, 
        time_to: duty.time_to, 
        reason, 
        suggested_alt_id: suggestedAlt || null
      });
      
      Alert.alert(
        'Request Submitted',
        'Your alteration request has been submitted. You will be notified once admin reviews it.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.error);
      } else {
        setErrorMsg('Network Error: Could not submit request');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingDuty) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{marginTop: 10, color: '#6B7280'}}>Fetching duty details...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.center}>
        <Text style={styles.fetchErrorText}>{fetchError}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Request Alteration</Text>
          <Text style={styles.modalSubtitle}>Fill the details below to request a change</Text>
          
          <View style={styles.divider} />

          <View style={styles.formGroupRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.inputLabel}>EXAM DATE</Text>
              <TextInput style={styles.readonlyInput} value={duty.exam_date} editable={false} pointerEvents="none" />
            </View>
            <View style={styles.formGroupHalf}>
              <Text style={styles.inputLabel}>ROOM NUMBER</Text>
              <TextInput style={styles.readonlyInput} value={duty.room_no} editable={false} pointerEvents="none" />
            </View>
          </View>

          <View style={styles.formGroupRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.inputLabel}>TIME FROM</Text>
              <TextInput style={styles.readonlyInput} value={duty.time_from} editable={false} pointerEvents="none" />
            </View>
            <View style={styles.formGroupHalf}>
              <Text style={styles.inputLabel}>TIME TO</Text>
              <TextInput style={styles.readonlyInput} value={duty.time_to} editable={false} pointerEvents="none" />
            </View>
          </View>

          <Text style={styles.inputLabel}>REASON FOR ALTERATION</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter reason..."
            multiline
            numberOfLines={3}
            value={reason}
            onChangeText={setReason}
          />

          <Text style={styles.inputLabel}>ALTERNATE STAFF ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional (e.g. T003)"
            autoCapitalize="characters"
            value={suggestedAlt}
            onChangeText={setSuggestedAlt}
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.btnContainer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  fetchErrorText: { fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 20 },
  backBtn: { backgroundColor: '#2563EB', padding: 12, borderRadius: 8 },
  backBtnText: { color: 'white', fontWeight: 'bold' },

  modalCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },

  formGroupRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  formGroupHalf: { width: '48%' },
  
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' },
  
  readonlyInput: { backgroundColor: '#F9FAFB', color: '#6B7280', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 16, fontWeight: '500' },
  input: { backgroundColor: 'white', color: '#1F2937', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', fontSize: 16, marginBottom: 16 },
  textArea: { backgroundColor: 'white', color: '#1F2937', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', fontSize: 16, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  
  errorText: { color: '#DC2626', marginBottom: 16, textAlign: 'center' },
  
  btnContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 12 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: 'white' },
  cancelBtnText: { color: '#374151', fontSize: 16, fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
