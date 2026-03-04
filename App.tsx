// @ts-nocheck
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, AppState } from 'react-native';
import { useStore } from './src/store/useStore';
import TabNavigator from './src/navigation/TabNavigator';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state = { hasError: false, errorText: '' };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorText: error?.toString() || 'Unknown error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>Error Web:</Text>
          <Text style={{ marginTop: 10 }}>{this.state.errorText}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {

  useEffect(() => {
    // Initial check on mount
    useStore.getState().checkAndResetDay();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        useStore.getState().checkAndResetDay();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NavigationContainer>
          <StatusBar style="auto" />
          <TabNavigator />
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
