import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => { setTimeout(() => SplashScreen.hideAsync(), 500); }, []);
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <LanguageProvider>
          <AppNavigator />
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
