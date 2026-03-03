// @ts-nocheck
import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, AppState } from 'react-native';
import { useStore } from './src/store/useStore';
import TabNavigator from './src/navigation/TabNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { supabase } from './src/lib/supabase';
import { Session } from '@supabase/supabase-js';

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
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Initial check on mount
    useStore.getState().checkAndResetDay();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        useStore.getState().checkAndResetDay();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        useStore.getState().pullStateFromCloud(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        useStore.getState().pullStateFromCloud(session.user.id);
      }
    });

    let syncTimeout: NodeJS.Timeout;
    const unsubStore = useStore.subscribe((state: any) => {
      if (session && session.user) {
        // Debounce push to avoid spamming the database
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          useStore.getState().pushStateToCloud();
        }, 3000);
      }
    });

    return () => {
      subscription.remove();
      unsubStore();
      clearTimeout(syncTimeout);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NavigationContainer>
          <StatusBar style="auto" />
          {session && session.user ? <TabNavigator /> : <AuthScreen />}
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
