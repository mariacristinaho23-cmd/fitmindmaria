import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
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
