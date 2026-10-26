import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import api from '../services/api';

export default function HistoryScreen({ onSelectToken, onBack }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/tokens/customer/me');
      if (res.data.success) {
        setTokens(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching history', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>Loading Token History...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Token History</Text>
        <Text style={styles.subtitle}>All active, completed, and cancelled tickets</Text>
      </View>

      {tokens.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No token history found.</Text>
        </View>
      ) : (
        tokens.map((t) => (
          <TouchableOpacity
            key={t._id}
            style={styles.card}
            onPress={() => onSelectToken(t._id)}
          >
            <View style={styles.leftCol}>
              <Text style={styles.tokenNum}>{t.tokenNumber}</Text>
              <Text style={styles.serviceName}>{t.serviceId?.name || 'Service'}</Text>
              <Text style={styles.dateText}>{new Date(t.createdAt).toLocaleDateString()}</Text>
            </View>

            <View style={styles.rightCol}>
              <Text style={[
                styles.badge,
                t.status === 'COMPLETED' && styles.badgeCompleted,
                t.status === 'CANCELLED' && styles.badgeCancelled,
                (t.status === 'WAITING' || t.status === 'SERVING') && styles.badgeActive
              ]}>
                {t.status}
              </Text>
              {t.actualServiceDuration ? (
                <Text style={styles.duration}>Duration: {t.actualServiceDuration}m</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.buttonBack} onPress={onBack}>
        <Text style={styles.buttonBackText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B'
  },
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  subtitle: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  leftCol: {
    flex: 1
  },
  tokenNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A'
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4
  },
  rightCol: {
    alignItems: 'flex-end'
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden'
  },
  badgeCompleted: {
    backgroundColor: '#DCFCE7',
    color: '#15803D'
  },
  badgeCancelled: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C'
  },
  badgeActive: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1'
  },
  duration: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14
  },
  buttonBack: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10
  },
  buttonBackText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13
  }
});
