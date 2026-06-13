import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function TimetableScreen() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await api.get('/timetable');
      setTimetable(response.data);
    } catch (error) {
      setErrorMsg('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{item.exam_date}</Text>
        <Text style={styles.dayText}>Day {index + 1}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.timeText}>{item.time_from.substring(0,5)} - {item.time_to.substring(0,5)}</Text>
        <Text style={styles.subjectText}>Subject: {item.subject_code}</Text>
        
        {item.is_visible ? (
          <Text style={styles.roomText}>Room: <Text style={styles.bold}>{item.room_no}</Text>  Seat: <Text style={styles.bold}>{item.seat_label}</Text></Text>
        ) : (
          <Text style={styles.notVisibleText}>Room & Seat: Available 2hrs before exam</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Timetable</Text>
        <Text style={styles.subtitle}>Your upcoming exam schedule</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : timetable.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No upcoming exams scheduled</Text>
        </View>
      ) : (
        <FlatList
          data={timetable}
          keyExtractor={(item, index) => String(index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  
  listContainer: { padding: 16 },
  
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981', // green accent
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB'
  },
  dateText: { fontWeight: 'bold', color: '#2563EB', fontSize: 16 },
  dayText: { color: '#6B7280', fontWeight: '500' },
  
  cardBody: { padding: 16 },
  timeText: { fontSize: 16, color: '#1F2937', marginBottom: 8 },
  subjectText: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  roomText: { fontSize: 14, color: '#1F2937' },
  bold: { fontWeight: 'bold' },
  notVisibleText: { fontSize: 14, color: '#D97706', fontStyle: 'italic' },
  
  errorText: { color: 'red', textAlign: 'center', marginTop: 40 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#6B7280', fontSize: 16 },
});
