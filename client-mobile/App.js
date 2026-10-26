import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SelectCentreScreen from './src/screens/SelectCentreScreen';
import SelectServiceScreen from './src/screens/SelectServiceScreen';
import LiveQueueScreen from './src/screens/LiveQueueScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

function MainApp() {
  const { user, loading } = useContext(AuthContext);

  // Screen state: 'login' | 'register' | 'home' | 'selectCentre' | 'selectService' | 'liveQueue' | 'history' | 'profile'
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [activeTokenId, setActiveTokenId] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setCurrentScreen('login');
      } else {
        setCurrentScreen('home');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>Initializing Dynamic Queue Mobile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.content}>
        
        {currentScreen === 'login' && (
          <LoginScreen
            onNavigateRegister={() => setCurrentScreen('register')}
            onLoginSuccess={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'register' && (
          <RegisterScreen
            onNavigateLogin={() => setCurrentScreen('login')}
            onRegisterSuccess={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            onGenerateTokenPress={() => setCurrentScreen('selectCentre')}
            onViewTokenPress={(tId) => {
              setActiveTokenId(tId);
              setCurrentScreen('liveQueue');
            }}
            onHistoryPress={() => setCurrentScreen('history')}
            onProfilePress={() => setCurrentScreen('profile')}
          />
        )}

        {currentScreen === 'selectCentre' && (
          <SelectCentreScreen
            onSelectCentre={(centre) => {
              setSelectedCentre(centre);
              setCurrentScreen('selectService');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'selectService' && (
          <SelectServiceScreen
            centre={selectedCentre}
            onTokenGenerated={(tokenId) => {
              setActiveTokenId(tokenId);
              setCurrentScreen('liveQueue');
            }}
            onBack={() => setCurrentScreen('selectCentre')}
          />
        )}

        {currentScreen === 'liveQueue' && (
          <LiveQueueScreen
            tokenId={activeTokenId}
            onBack={() => setCurrentScreen('home')}
            onTokenCancelled={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            onSelectToken={(tId) => {
              setActiveTokenId(tId);
              setCurrentScreen('liveQueue');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            onBack={() => setCurrentScreen('home')}
            onLogoutSuccess={() => setCurrentScreen('login')}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '600'
  }
});
