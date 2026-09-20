import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { ReceiptScreen } from './src/screens/ReceiptScreen';
import { TransportScreen } from './src/screens/TransportScreen';
import { SearchScreen } from './src/screens/SearchScreen';

// Development API Base URL (defaults to localhost Next.js server)
const API_BASE_URL = 'http://localhost:3000';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'scan' | 'receipt' | 'transport' | 'search'>('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'scan':
        return <ScanScreen onBack={() => setCurrentScreen('home')} apiBaseUrl={API_BASE_URL} />;
      case 'receipt':
        return <ReceiptScreen onBack={() => setCurrentScreen('home')} apiBaseUrl={API_BASE_URL} />;
      case 'transport':
        return <TransportScreen onBack={() => setCurrentScreen('home')} apiBaseUrl={API_BASE_URL} />;
      case 'search':
        return <SearchScreen onBack={() => setCurrentScreen('home')} apiBaseUrl={API_BASE_URL} />;
      default:
        return <HomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
