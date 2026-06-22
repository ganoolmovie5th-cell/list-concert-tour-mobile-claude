import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { HomeScreen } from '../screens/HomeScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { NewsletterScreen } from '../screens/NewsletterScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { KaraokeScreen } from '../screens/KaraokeScreen';
import { PassportScreen } from '../screens/PassportScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const WishlistStack = createNativeStackNavigator();
const CalendarStack = createNativeStackNavigator();
const NewsletterStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Detail" component={DetailScreen} />
      <HomeStack.Screen name="Karaoke" component={KaraokeScreen} />
    </HomeStack.Navigator>
  );
}

function WishlistStackNav() {
  return (
    <WishlistStack.Navigator screenOptions={{ headerShown: false }}>
      <WishlistStack.Screen name="Wishlist" component={WishlistScreen} />
      <WishlistStack.Screen name="Detail" component={DetailScreen} />
      <WishlistStack.Screen name="Karaoke" component={KaraokeScreen} />
    </WishlistStack.Navigator>
  );
}

function CalendarStackNav() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen name="Calendar" component={CalendarScreen} />
      <CalendarStack.Screen name="Detail" component={DetailScreen} />
      <CalendarStack.Screen name="Karaoke" component={KaraokeScreen} />
    </CalendarStack.Navigator>
  );
}

function NewsletterStackNav() {
  return (
    <NewsletterStack.Navigator screenOptions={{ headerShown: false }}>
      <NewsletterStack.Screen name="Newsletter" component={NewsletterScreen} />
    </NewsletterStack.Navigator>
  );
}

function MoreStackNav() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="More" component={MoreScreen} />
      <MoreStack.Screen name="Passport" component={PassportScreen} />
    </MoreStack.Navigator>
  );
}

function WishlistBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

export function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { wishlist } = useWishlist();

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.tabBar, border: colors.tabBarBorder, primary: colors.accent, text: colors.text, notification: colors.accent } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.tabBar, border: colors.tabBarBorder, primary: colors.accent, text: colors.text, notification: colors.accent } };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: 62,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, { focused: any; outline: any }> = {
              HomeTab: { focused: 'musical-notes', outline: 'musical-notes-outline' },
              WishlistTab: { focused: 'heart', outline: 'heart-outline' },
              CalendarTab: { focused: 'calendar', outline: 'calendar-outline' },
              NewsletterTab: { focused: 'mail', outline: 'mail-outline' },
              MoreTab: { focused: 'ellipsis-horizontal-circle', outline: 'ellipsis-horizontal-circle-outline' },
            };
            const icon = icons[route.name];
            return (
              <View style={{ position: 'relative' }}>
                <Ionicons name={focused ? icon.focused : icon.outline} size={size} color={color} />
                {route.name === 'WishlistTab' && <WishlistBadge count={wishlist.size} />}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="HomeTab" component={HomeStackNav} options={{ title: t('home') }} />
        <Tab.Screen name="WishlistTab" component={WishlistStackNav} options={{ title: t('wishlist') }} />
        <Tab.Screen name="CalendarTab" component={CalendarStackNav} options={{ title: t('calendar') }} />
        <Tab.Screen name="NewsletterTab" component={NewsletterStackNav} options={{ title: t('newsletter') }} />
        <Tab.Screen name="MoreTab" component={MoreStackNav} options={{ title: t('more') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#ef4444', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
