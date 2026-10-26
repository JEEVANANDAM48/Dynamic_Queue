import React, { useState, useEffect } from 'react';
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

export default function SelectServiceScreen({ centre, onTokenGenerated, onBack }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/admin/services');
      if (res.data.success) {
        const filtered = res.data.data.filter(
          s => !s.serviceCentreId || s.serviceCentreId._id === centre._id || s.serviceCentreId === centre._id
        );
        setServices(filtered.length > 0 ? filtered : res.data.data);
      }
    } catch (err) {
      console.error('Failed to load services', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async (service) => {
    setGenerating(true);
    try {
      const res = await api.post('/tokens', {
        serviceId: service._id,
        serviceCentreId: centre._id
      });

      if (res.data.success) {
        onTokenGenerated(res.data.data._id);
      }
    } catch (err) {
      Alert.alert('Generation Error', err.response?.data?.message || 'Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>Loading Available Services...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Select Service Category</Text>
        <Text style={styles.subtitle}>Step 2 of 2: {centre.name}</Text>
      </View>

      {generating && (
        <View style={styles.generatingOverlay}>
          <ActivityIndicator size="small" color="#0284C7" />
          <Text style={styles.generatingText}>Feeding Central Queue & Calculating Wait Time...</Text>
        </View>
      )}

      {services.map((service) => (
        <TouchableOpacity
          key={service._id}
          style={styles.serviceCard}
          onPress={() => handleGenerateToken(service)}
          disabled={generating}
        >
          <View style={styles.badgePrefix}>
            <Text style={styles.badgePrefixText}>{service.code}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDesc}>{service.description || 'Standard Service Desk'}</Text>
            <Text style={styles.durationText}>
              ⏱️ Default Duration: ~{service.defaultDurationMinutes || 10} mins
            </Text>
          </View>
          <Text style={styles.buttonGenerateText}>Get Token &rarr;</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.buttonBack} onPress={onBack} disabled={generating}>
        <Text style={styles.buttonBackText}>Back to Centres</Text>
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
  generatingOverlay: {
    backgroundColor: '#E0F2FE',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  generatingText: {
    color: '#0369A1',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 10
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
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  badgePrefix: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  badgePrefixText: {
    color: '#38BDF8',
    fontWeight: '900',
    fontSize: 20
  },
  infoCol: {
    flex: 1
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  serviceDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 4
  },
  buttonGenerateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7'
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
