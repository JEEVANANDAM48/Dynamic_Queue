import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen({ onBack, onLogoutSuccess }) {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    if (onLogoutSuccess) onLogoutSuccess();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user ? user.name.charAt(0).toUpperCase() : 'C'}
          </Text>
        </View>
        <Text style={styles.name}>{user ? user.name : 'Customer'}</Text>
        <Text style={styles.email}>{user ? user.email : 'customer@queue.com'}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>{user ? user.role : 'CUSTOMER'}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Account Type</Text>
          <Text style={styles.rowVal}>Customer Mobile App</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={styles.rowValGreen}>Verified Active</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
        <Text style={styles.buttonLogoutText}>Logout</Text>
      </TouchableOpacity>

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
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  email: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2
  },
  roleTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38BDF8'
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  rowVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700'
  },
  rowValGreen: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '700'
  },
  buttonLogout: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10
  },
  buttonLogoutText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13
  },
  buttonBack: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  buttonBackText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13
  }
});
