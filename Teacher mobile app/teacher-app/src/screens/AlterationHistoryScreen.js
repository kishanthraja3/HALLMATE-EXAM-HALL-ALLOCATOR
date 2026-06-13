import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function AlterationHistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/alteration/history');
      setHistory(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const renderItem = ({ item }) => {
    let badgeStyle = styles.badgePending;
    let badgeText = styles.badgeTextPending;
    if (item.status === 'approved') {
      badgeStyle = styles.badgeApproved;
      badgeText = styles.badgeTextApproved;
    } else if (item.status === 'rejected') {
      badgeStyle = styles.badgeRejected;
      badgeText = styles.badgeTextRejected;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.roomNo}>Room {item.room_no}</Text>
          <View style={[styles.badge, badgeStyle]}>
            <Text style={badgeText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.datetime}>{item.exam_date} · {item.time_from} - {item.time_to}</Text>
        <Text style={styles.reason}><Text style={{fontWeight:'bold'}}>Reason:</Text> {item.reason}</Text>
        {item.suggested_alt_id ? <Text style={styles.reason}><Text style={{fontWeight:'bold'}}>Suggested Alt:</Text> {item.suggested_alt_id}</Text> : null}

        {item.status === 'approved' && item.final_teacher_id && (
          <Text style={styles.approvedText}>Assigned to: {item.final_teacher_id}</Text>
        )}
        {item.status === 'rejected' && (
          <Text style={styles.rejectedText}>Request was not approved</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Alteration History</Text>
          <TouchableOpacity 
            style={styles.newBtn} 
            onPress={() => navigation.navigate('RequestAlteration')}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Your alteration request history</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No alteration requests submitted yet</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  newBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  newBtnText: { color: 'white', fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#6B7280', fontSize: 16 },
  
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roomNo: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  datetime: { color: '#6B7280', marginBottom: 8 },
  reason: { color: '#4B5563', marginBottom: 4 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeTextPending: { color: '#92400E', fontSize: 12, fontWeight: 'bold' },
  badgeApproved: { backgroundColor: '#D1FAE5' },
  badgeTextApproved: { color: '#065F46', fontSize: 12, fontWeight: 'bold' },
  badgeRejected: { backgroundColor: '#FEE2E2' },
  badgeTextRejected: { color: '#991B1B', fontSize: 12, fontWeight: 'bold' },

  approvedText: { color: '#059669', fontWeight: 'bold', marginTop: 8 },
  rejectedText: { color: '#DC2626', fontWeight: 'bold', marginTop: 8 }
});
