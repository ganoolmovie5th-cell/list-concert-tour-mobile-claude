import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useApp } from '../context/AppContext';

interface ToastProps {
  message: string;
  visible: boolean;
  type?: 'success' | 'error' | 'info';
}

export function Toast({ message, visible, type = 'success' }: ToastProps) {
  const { colors } = useApp();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);

  const bgColor = type === 'success' ? colors.toastSuccess : type === 'error' ? colors.toastError : colors.toastInfo;

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: bgColor }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 90, left: 24, right: 24,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20,
    alignItems: 'center', zIndex: 9999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
