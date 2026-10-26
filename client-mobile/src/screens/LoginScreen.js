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

export default function LoginScreen({ onNavigateRegister, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoCustomerLogin = () => {
    setEmail('customer@queue.com');
    setPassword('password123');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>Q</Text>
          </View>
          <Text style={styles.title}>Customer Portal</Text>
          <Text style={styles.subtitle}>Dynamic Token & Real-Time Queue System</Text>
        </View>

        <View style={styles.formCard}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="customer@queue.com"
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
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Sign In to App</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonDemo}
            onPress={handleDemoCustomerLogin}
          >
            <Text style={styles.buttonDemoText}>Fill Demo Customer Account</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateRegister}>
              <Text style={styles.linkText}>Register Here</Text>
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
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 24
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
  buttonDemo: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  buttonDemoText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12
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
