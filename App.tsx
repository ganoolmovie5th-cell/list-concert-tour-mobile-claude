import React from 'react';
import { registerRootComponent } from 'expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { VoteCountsProvider } from './src/context/VoteCountsContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useNotifications } from './src/hooks/useNotifications';

enableScreens();

function AppInner() {
  useNotifications(); // register notif listener
  return <AppNavigator />;
}

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <LanguageProvider>
          <WishlistProvider>
            <VoteCountsProvider>
              <AppInner />
            </VoteCountsProvider>
          </WishlistProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

registerRootComponent(App);

export default App;
