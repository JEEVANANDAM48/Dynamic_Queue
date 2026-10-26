import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import api from '../services/api';
import { getSocket, subscribeToToken } from '../services/socket';
import { AuthContext } from '../context/AuthContext';

export default function LiveQueueScreen({ tokenId, onBack, onTokenCancelled }) {
  const { user } = useContext(AuthContext);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    fetchTokenDetails();
  }, [tokenId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (tokenId) {
      subscribeToToken(tokenId);
    }

    if (token && token.serviceCentreId) {
      const centreId = typeof token.serviceCentreId === 'object' ? token.serviceCentreId._id : token.serviceCentreId;
      socket.emit('joinServiceCentre', centreId);
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleTokenUpdated = (updatedData) => {
      if (updatedData.tokenId === tokenId || (token && updatedData.tokenId === token._id)) {
        setToken((prev) => prev ? {
          ...prev,
          estimatedWaitMinutes: updatedData.estimatedWaitMinutes ?? prev.estimatedWaitMinutes,
          peopleAhead: updatedData.peopleAhead ?? prev.peopleAhead,
          queuePosition: updatedData.queuePosition ?? prev.queuePosition,
          status: updatedData.status ?? prev.status,
          counterId: updatedData.counterId ?? prev.counterId
        } : prev);
        fetchTokenDetails();
      }
    };

    const handleQueueChanged = () => fetchTokenDetails();

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('tokenUpdated', handleTokenUpdated);
    socket.on('queueUpdated', handleQueueChanged);
    socket.on('tokenCalled', handleQueueChanged);
    socket.on('serviceStarted', handleQueueChanged);
    socket.on('serviceCompleted', handleQueueChanged);

    // Auto-refresh interval (every 3 seconds) for guaranteed synchronization
    const syncInterval = setInterval(() => {
      fetchTokenDetails();
    }, 3000);

    return () => {
      clearInterval(syncInterval);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('tokenUpdated', handleTokenUpdated);
      socket.off('queueUpdated', handleQueueChanged);
      socket.off('tokenCalled', handleQueueChanged);
      socket.off('serviceStarted', handleQueueChanged);
      socket.off('serviceCompleted', handleQueueChanged);
    };
  }, [tokenId, token]);

  const fetchTokenDetails = async () => {
    if (!tokenId) return;
    try {
      const res = await api.get(`/tokens/${tokenId}`);
      if (res.data.success) {
        setToken(res.data.data);
      }
    } catch (err) {
      console.error('Error loading live token', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelToken = async () => {
    Alert.alert(
      'Cancel Token',
      'Are you sure you want to cancel your token? This action cannot be undone.',
      [
        { text: 'Keep Token', style: 'cancel' },
        {
          text: 'Cancel Token',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await api.delete(`/tokens/${token._id}`);
              if (res.data.success) {
                Alert.alert('Token Cancelled', 'Your token has been successfully cancelled.');
                if (onTokenCancelled) onTokenCancelled();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel token');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={styles.loadingText}>Fetching real-time queue status...</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Token Not Found</Text>
        <TouchableOpacity style={styles.buttonBack} onPress={onBack}>
          <Text style={styles.buttonBackText}>Go Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCalledOrServing = token.status === 'CALLED' || token.status === 'SERVING';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* Top Connection Banner */}
      <View style={[styles.connectionBanner, !isConnected && styles.connectionBannerOffline]}>
        <View style={[styles.statusDot, !isConnected && styles.statusDotOffline]} />
        <Text style={styles.connectionText}>
          {isConnected ? 'Queue Status: LIVE REAL-TIME' : 'Connection lost. Reconnecting...'}
        </Text>
      </View>

      {/* Main Token Display Card */}
      <View style={[styles.tokenCard, isCalledOrServing && styles.tokenCardServing]}>
        
        <Text style={styles.labelHeader}>
          {isCalledOrServing ? 'NOW SERVING' : 'YOUR TOKEN'}
        </Text>
        
        {/* Token Number is IMMUTABLE */}
        <Text style={styles.tokenNumber}>{token.tokenNumber}</Text>

        <Text style={styles.serviceName}>
          {token.serviceId?.name || 'General Service'}
        </Text>
        <Text style={styles.centreName}>
          {token.serviceCentreId?.name || 'City Service Centre'}
        </Text>

        {/* Status Badge */}
        <View style={styles.statusBadgeWrapper}>
          <Text style={[
            styles.statusBadge,
            token.status === 'SERVING' && styles.badgeServing,
            token.status === 'CALLED' && styles.badgeCalled,
            token.status === 'WAITING' && styles.badgeWaiting,
            token.status === 'COMPLETED' && styles.badgeCompleted,
            token.status === 'CANCELLED' && styles.badgeCancelled
          ]}>
            ● STATUS: {token.status}
          </Text>
        </View>

      </View>

      {/* Dynamic Queue Metrics Grid */}
      <View style={styles.metricsGrid}>
        
        {/* People Ahead */}
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>PEOPLE AHEAD</Text>
          <Text style={styles.metricValue}>
            {token.status === 'WAITING' ? token.peopleAhead : 0}
          </Text>
          <Text style={styles.metricSubtext}>Customers in front of you</Text>
        </View>

        {/* Estimated Wait Time */}
        <View style={styles.metricCardPrimary}>
          <Text style={styles.metricTitleLight}>ESTIMATED WAIT</Text>
          <Text style={styles.metricValueLight}>
            {token.status === 'WAITING' ? `${token.estimatedWaitMinutes} min` : '0 min'}
          </Text>
          <Text style={styles.metricSubtextLight}>Dynamically recalculated</Text>
        </View>

        {/* Assigned Counter */}
        <View style={styles.metricCardFull}>
          <Text style={styles.metricTitle}>ASSIGNED COUNTER</Text>
          <Text style={styles.counterValue}>
            {token.counterId ? (token.counterId.counterNumber || 'Counter Assigned') : 'Not Assigned'}
          </Text>
          <Text style={styles.metricSubtext}>
            {isCalledOrServing ? 'Please proceed to counter desk immediately' : 'Will be assigned when your turn arrives'}
          </Text>
        </View>

      </View>

      {/* Informational Footer */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Turn Progress Information</Text>
        <Text style={styles.infoBody}>
          Your token number ({token.tokenNumber}) remains fixed. The waiting time updates dynamically as actual services are completed by staff at active counters.
        </Text>
      </View>

      {/* Action Buttons */}
      {token.status === 'WAITING' && (
        <TouchableOpacity
          style={styles.buttonCancel}
          onPress={handleCancelToken}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.buttonCancelText}>Cancel Token</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.buttonSecondary} onPress={onBack}>
        <Text style={styles.buttonSecondaryText}>Back to Dashboard</Text>
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
    backgroundColor: '#F8FAFC',
    padding: 20
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600'
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16
  },
  connectionBannerOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  statusDotOffline: {
    backgroundColor: '#EF4444'
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5
  },
  tokenCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6
  },
  tokenCardServing: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
    borderWidth: 2
  },
  labelHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 2,
    marginBottom: 4
  },
  tokenNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginVertical: 4
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center'
  },
  centreName: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500'
  },
  statusBadgeWrapper: {
    marginTop: 16
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    letterSpacing: 1
  },
  badgeWaiting: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#FBBF24'
  },
  badgeCalled: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#60A5FA'
  },
  badgeServing: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34D399'
  },
  badgeCompleted: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    color: '#94A3B8'
  },
  badgeCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#F87171'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  metricCardPrimary: {
    width: '48%',
    backgroundColor: '#0284C7',
    borderRadius: 20,
    padding: 18
  },
  metricCardFull: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1
  },
  metricTitleLight: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BAE6FD',
    letterSpacing: 1
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4
  },
  metricValueLight: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4
  },
  counterValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0369A1',
    marginVertical: 4
  },
  metricSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500'
  },
  metricSubtextLight: {
    fontSize: 11,
    color: '#E0F2FE',
    fontWeight: '500'
  },
  infoBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4
  },
  infoBody: {
    fontSize: 11,
    color: '#64748B',
    leadingHeight: 16
  },
  buttonCancel: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10
  },
  buttonCancelText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  buttonSecondaryText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13
  }
});
