import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { QUIZ_DATA } from '@/constants/quiz';

export default function ResultScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <ThemedText type="title">Runestone Code</ThemedText>
        <ThemedText style={styles.code}>{QUIZ_DATA.runestoneCode}</ThemedText>
      </Animated.View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
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
  button: { padding: 10, borderRadius: 8, backgroundColor: '#E6F4FE' },
});
