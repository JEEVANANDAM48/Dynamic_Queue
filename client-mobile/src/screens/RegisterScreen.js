import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ onNavigateLogin, onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Dynamic Queue Management System</Text>
        </View>

        <View style={styles.formCard}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateLogin}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 20
  },
  headerCard: {
    backgroundColor: '#0F172A',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '500'
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center'
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16
  },
  buttonPrimary: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  footerText: {
    fontSize: 13,
    color: '#64748B'
  },
  linkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7'
  }
});
