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

export default function SelectCentreScreen({ onSelectCentre, onBack }) {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      const res = await api.get('/admin/service-centres');
      if (res.data.success) {
        setCentres(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load service centres', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>Loading Service Centres...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Select Service Centre</Text>
        <Text style={styles.subtitle}>Step 1 of 2: Choose your location</Text>
      </View>

      {centres.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Service Centres Available</Text>
          <Text style={styles.emptySubtitle}>Please check back shortly or tap below to refresh.</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchCentres}>
            <Text style={styles.refreshBtnText}>Refresh List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        centres.map((centre) => (
          <TouchableOpacity
            key={centre._id}
            style={styles.centreCard}
            onPress={() => onSelectCentre(centre)}
          >
            <View style={styles.iconBg}>
              <Text style={styles.iconText}>🏢</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.centreName}>{centre.name}</Text>
              <Text style={styles.centreAddress}>{centre.address || 'Central Office'}</Text>
              <Text style={styles.centreCode}>CODE: {centre.code}</Text>
            </View>
            <Text style={styles.arrow}>&rarr;</Text>
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
  centreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  iconText: {
    fontSize: 20
  },
  infoCol: {
    flex: 1
  },
  centreName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  centreAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  centreCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 4
  },
  arrow: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '800'
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
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14
  },
  refreshBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10
  },
  refreshBtnText: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 12
  }
});
