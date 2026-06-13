import React, { useEffect, useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';

enableScreens();
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Simulasi loading sedikit
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <LanguageProvider>
          <AppNavigator />
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
