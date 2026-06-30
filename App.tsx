import React from 'react';
import { registerRootComponent } from 'expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { AppProvider } from './src/context/AppContext';
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
      <AppProvider>
        <AppInner />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

registerRootComponent(App);

export default App;
