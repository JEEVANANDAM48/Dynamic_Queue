import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen({
  onGenerateTokenPress,
  onViewTokenPress,
  onHistoryPress,
  onProfilePress
}) {
  const { user } = useContext(AuthContext);
  const [activeToken, setActiveToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActiveCustomerToken();
  }, []);

  const fetchActiveCustomerToken = async () => {
    try {
      const res = await api.get('/tokens/customer/me');
      if (res.data.success && res.data.data.length > 0) {
        // Find first active token (WAITING, CALLED, SERVING)
        const active = res.data.data.find(
          t => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'SERVING'
        );
        setActiveToken(active || null);
      } else {
        setActiveToken(null);
      }
    } catch (err) {
      console.error('Error fetching customer tokens', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActiveCustomerToken();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      
      {/* User Greeting */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingSub}>WELCOME BACK</Text>
          <Text style={styles.greetingName}>{user ? user.name : 'Customer'}</Text>
        </View>
        <TouchableOpacity style={styles.profileBadge} onPress={onProfilePress}>
          <Text style={styles.profileBadgeText}>
            {user ? user.name.charAt(0).toUpperCase() : 'C'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Token Card Banner */}
      {activeToken ? (
        <View style={styles.activeBanner}>
          <View style={styles.activeHeader}>
            <Text style={styles.activeLabel}>ACTIVE QUEUE TOKEN</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <Text style={styles.activeTokenNumber}>{activeToken.tokenNumber}</Text>
          <Text style={styles.activeServiceName}>{activeToken.serviceId?.name || 'General Consultation'}</Text>

          <View style={styles.activeStatsRow}>
            <View>
              <Text style={styles.activeStatLabel}>EST. WAIT</Text>
              <Text style={styles.activeStatVal}>{activeToken.estimatedWaitMinutes} mins</Text>
            </View>
            <View>
              <Text style={styles.activeStatLabel}>PEOPLE AHEAD</Text>
              <Text style={styles.activeStatVal}>{activeToken.peopleAhead}</Text>
            </View>
            <View>
              <Text style={styles.activeStatLabel}>STATUS</Text>
              <Text style={styles.activeStatVal}>{activeToken.status}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.buttonViewToken}
            onPress={() => onViewTokenPress(activeToken._id)}
          >
            <Text style={styles.buttonViewTokenText}>Open Live Ticket Screen &rarr;</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noActiveCard}>
          <Text style={styles.noActiveTitle}>No Active Token</Text>
          <Text style={styles.noActiveSub}>Get a new token to join the service queue with real-time estimation.</Text>
          <TouchableOpacity
            style={styles.buttonGenerate}
            onPress={onGenerateTokenPress}
          >
            <Text style={styles.buttonGenerateText}>+ Get Service Token</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Menu Options */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <TouchableOpacity style={styles.menuCard} onPress={onGenerateTokenPress}>
        <View style={styles.menuIconBg}>
          <Text style={styles.menuIcon}>🎟️</Text>
        </View>
        <View style={styles.menuTextCol}>
          <Text style={styles.menuTitle}>Generate New Token</Text>
          <Text style={styles.menuSub}>Select service centre & join central queue</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={onHistoryPress}>
        <View style={styles.menuIconBgAlt}>
          <Text style={styles.menuIcon}>📜</Text>
        </View>
        <View style={styles.menuTextCol}>
          <Text style={styles.menuTitle}>Token History</Text>
          <Text style={styles.menuSub}>View past completed & cancelled queue tokens</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={onProfilePress}>
        <View style={styles.menuIconBgSub}>
          <Text style={styles.menuIcon}>👤</Text>
        </View>
        <View style={styles.menuTextCol}>
          <Text style={styles.menuTitle}>Account & Profile</Text>
          <Text style={styles.menuSub}>Manage account details and preferences</Text>
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  greetingSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 1
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A'
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileBadgeText: {
    color: '#38BDF8',
    fontWeight: '900',
    fontSize: 18
  },
  activeBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4
  },
  liveText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '900'
  },
  activeTokenNumber: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4
  },
  activeServiceName: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600'
  },
  activeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155'
  },
  activeStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B'
  },
  activeStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2
  },
  buttonViewToken: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  buttonViewTokenText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  noActiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  noActiveTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  noActiveSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16
  },
  buttonGenerate: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12
  },
  buttonGenerateText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  menuIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  menuIconBgAlt: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  menuIconBgSub: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  menuIcon: {
    fontSize: 20
  },
  menuTextCol: {
    flex: 1
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  }
});
