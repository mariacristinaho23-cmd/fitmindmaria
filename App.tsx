// @ts-nocheck
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, AppState } from 'react-native';
import { useStore } from './src/store/useStore';
import TabNavigator from './src/navigation/TabNavigator';
import { supabase } from './src/lib/supabase';

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

    // Silent login & sync
    const initSync = async () => {
      try {
        const email = process.env.EXPO_PUBLIC_USER_EMAIL;
        const password = process.env.EXPO_PUBLIC_USER_PASSWORD;
        if (email && password) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (!error && data?.session?.user) {
            console.log('Silent login successful');
            await useStore.getState().pullStateFromCloud(data.session.user.id);

            let syncTimeout: NodeJS.Timeout;
            useStore.subscribe((state: AppState) => {
              if (syncTimeout) clearTimeout(syncTimeout);
              syncTimeout = setTimeout(() => {
                console.log('Auto-syncing state to cloud...');
                state.pushStateToCloud();
              }, 5000);
            });

          } else {
            console.error('Silent login failed:', error?.message);
          }
        } else {
          console.log('No credentials provided for silent login');
        }
      } catch (err) {
        console.error('Error during init sync:', err);
      }
    };
    initSync();

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
