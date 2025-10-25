import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { API_BASE } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import useBleScanner from '@/hooks/use-ble-scanner';
import { ARTIFACTS, Artifact } from '@/constants/artifacts';
import { QUIZ_DATA } from '@/constants/quiz';

export default function DetectionScreen() {
  const router = useRouter();
  const { detectedArtifacts, scannedDevices, isScanning, startScanning, stopScanning, allArtifactsDetected, error } = useBleScanner();
  const buttonSecondary = useThemeColor({}, 'buttonSecondary');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const border = useThemeColor({}, 'border');
  const accent = useThemeColor({}, 'accent');
  const incorrectAnswer = useThemeColor({}, 'incorrectAnswer');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const prevCountRef = useRef(0);
  const [team, setTeam] = useState<any | null>(null);
  const teamRetryRef = useRef<number | null>(null);

  useEffect(() => {
    // Poll /api/teams/latest until a team object is returned.
    let mounted = true;

    async function fetchLatest() {
      try {
        const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/teams/latest`);
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          // assume server returns null when no active team, or an object when present
          if (json && Object.keys(json).length > 0) {
            setTeam(json);
            return;
          }
        }
      } catch (err) {
        // ignore network errors while polling
        if (__DEV__) console.debug('[DetectionScreen] fetchLatest error', err);
      }
      // retry in 5s
      if (!mounted) return;
      teamRetryRef.current = (setTimeout(fetchLatest, 5000) as unknown) as number;
    }

    fetchLatest();

    return () => {
      mounted = false;
      if (teamRetryRef.current != null) clearTimeout(teamRetryRef.current as any);
    };
  }, []);


  useEffect(() => {
    const prev = prevCountRef.current;
    if (detectedArtifacts.length > prev) {
      // new detection
      Haptics.selectionAsync();
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 180, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
    prevCountRef.current = detectedArtifacts.length;
  }, [detectedArtifacts.length, pulseAnim]);

  useEffect(() => {
    if (allArtifactsDetected) {
      // small haptic to indicate completion and navigate to quiz after a moment
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const t = setTimeout(() => router.push('./quiz'), 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allArtifactsDetected]);

  // start scanning only after we have a team
  useEffect(() => {
    if (team) {
      startScanning();
      return () => stopScanning();
    }
    // if no team yet, ensure scanning stopped
    stopScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  const progress = Math.round((detectedArtifacts.length / ARTIFACTS.length) * 100);

  // If no active team yet, show a simple message and don't render the detection UI
  if (!team) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>No Museum experience initiated, head to the reception to start one</ThemedText>
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: Artifact }) => {
    const found = detectedArtifacts.some(d => d.id === item.id);
    return (
      <Animated.View style={[styles.artifactRow, { transform: [{ scale: found ? pulseAnim : 1 }], backgroundColor: cardBackground, borderColor: border }]}>
        <View style={styles.artifactInfo}>
          <ThemedText type="subtitle">{item.name}</ThemedText>
          <ThemedText>{item.description}</ThemedText>
        </View>
        <View style={styles.statusContainer}>
          {found ? (
            <ThemedText type="defaultSemiBold" style={{ color: accent }}>Found</ThemedText>
          ) : (
            <ThemedText>Searching…</ThemedText>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderDevice = ({ item }: { item: { id: string; name?: string | null; rssi?: number | null; serviceUUIDs?: string[] | null; localName?: string | null } }) => {
    return (
      <View style={styles.deviceRow}>
        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle">{item.name ?? item.localName ?? 'Unknown device'}</ThemedText>
          <ThemedText>{item.id}</ThemedText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <ThemedText>{item.rssi ? `${item.rssi} dBm` : ''}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.header, { transform: [{ scale: pulseAnim }] }]}>
        {QUIZ_DATA.runestoneName ? <ThemedText type="defaultSemiBold">{QUIZ_DATA.runestoneName + " " + team.name}</ThemedText> : null}
        <ThemedText type="title">Artifact Detection</ThemedText>
        <ThemedText>{progress}% found</ThemedText>
      </Animated.View>

      {error ? <ThemedText style={[styles.error, { color: incorrectAnswer }]}>{error}</ThemedText> : null}

      <FlatList
        data={ARTIFACTS}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />

      <ThemedText style={{ marginTop: 12 }} type="subtitle">Nearby Devices</ThemedText>
      <FlatList
        data={scannedDevices}
        keyExtractor={d => d.id}
        renderItem={renderDevice}
        contentContainerStyle={{ paddingVertical: 8 }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />

  <View style={styles.footer}>
        <ThemedText>{`Detected ${detectedArtifacts.length} of ${ARTIFACTS.length}`}</ThemedText>
        {allArtifactsDetected || true  ? (
          <TouchableOpacity style={[styles.cta, { backgroundColor: buttonPrimary }]} onPress={() => router.push('./quiz')}>
            <ThemedText type="defaultSemiBold" style={{ color: textSecondary }}>Take Quiz</ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { alignItems: 'center', marginBottom: 12 },
  list: { paddingVertical: 8 },
  artifactRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: 'transparent' },
  artifactInfo: { flex: 1 },
  statusContainer: { width: 90, alignItems: 'flex-end' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 },
  sep: { height: 8 },
  controls: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  button: { padding: 10, borderRadius: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  cta: { padding: 10, borderRadius: 8 },
  error: { marginVertical: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
