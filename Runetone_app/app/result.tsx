import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { QUIZ_DATA } from '@/constants/quiz';

export default function ResultScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.8)).current;
  const [displayText, setDisplayText] = useState('');
  const codeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // entrance spring
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    // decoding + reveal timeline
    const fullCode = QUIZ_DATA.runestoneCode ?? '';
    const scrambleDuration = 1200; // ms
    const scrambleInterval = 80; // ms

    let scrambleTimer: ReturnType<typeof setInterval> | null = null;
    let revealTimeout: ReturnType<typeof setTimeout> | null = null;

    // show scrambling placeholder while 'decoding'
    scrambleTimer = setInterval(() => {
      // random chars of same length
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const len = Math.max(3, fullCode.length || 3);
      let s = '';
      for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
      setDisplayText(s);
    }, scrambleInterval);

    // when scrambleDuration ends, clear scramble and typewriter reveal
    revealTimeout = setTimeout(() => {
      if (scrambleTimer) clearInterval(scrambleTimer);
      setDisplayText('');

      // simple typewriter reveal
      for (let i = 0; i <= fullCode.length; i++) {
        setTimeout(() => setDisplayText(fullCode.slice(0, i)), 60 * i);
      }

      // fade in code slightly as it types
      Animated.timing(codeOpacity, { toValue: 1, duration: Math.max(400, fullCode.length * 60), useNativeDriver: true }).start();
    }, scrambleDuration);

    return () => {
      if (scrambleTimer) clearInterval(scrambleTimer);
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, [scale, codeOpacity]);
  const cardBackground = useThemeColor({}, 'cardBackground');
  const buttonSecondary = useThemeColor({}, 'buttonSecondary');
  const primary = useThemeColor({}, 'primary');

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ scale }], backgroundColor: cardBackground }]}>
  <ThemedText type="title">Runestone Code</ThemedText>
  <Animated.Text style={[styles.code, { color: primary, opacity: codeOpacity }]}>{displayText}</Animated.Text>
      </Animated.View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.button, { backgroundColor: buttonSecondary }]} onPress={() => router.push('/')}>
          <ThemedText>Back to Detection</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 20, borderRadius: 12, alignItems: 'center' },
  code: { fontSize: 32, marginTop: 12 },
  controls: { marginTop: 20 },
  button: { padding: 10, borderRadius: 8 },
});
