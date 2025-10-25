import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import useBleScanner from '@/hooks/use-ble-scanner';
import { ARTIFACTS, Artifact } from '@/constants/artifacts';

export default function DetectionScreen() {
  const router = useRouter();
  const { detectedArtifacts, scannedDevices, isScanning, startScanning, stopScanning, allArtifactsDetected, error } = useBleScanner();
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const prevCountRef = useRef(0);

  useEffect(() => {
    // auto-start scanning on mount
    startScanning();
    return () => stopScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const progress = Math.round((detectedArtifacts.length / ARTIFACTS.length) * 100);

  const renderItem = ({ item }: { item: Artifact }) => {
    const found = detectedArtifacts.some(d => d.id === item.id);
    return (
      <Animated.View style={[styles.artifactRow, { transform: [{ scale: found ? pulseAnim : 1 }] }]}>
        <View style={styles.artifactInfo}>
          <ThemedText type="subtitle">{item.name}</ThemedText>
          <ThemedText>{item.description}</ThemedText>
        </View>
        <View style={styles.statusContainer}>
          {found ? (
            <ThemedText type="defaultSemiBold">Found</ThemedText>
          ) : (
            <ThemedText>Searching…</ThemedText>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderDevice = ({ item }: { item: { id: string; name?: string | null; rssi?: number | null; serviceUUIDs?: string[] | null } }) => {
    return (
      <View style={styles.deviceRow}>
        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle">{item.name ?? 'Unknown device'}</ThemedText>
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
        <ThemedText type="title">Artifact Detection</ThemedText>
        <ThemedText>{progress}% found</ThemedText>
      </Animated.View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => (isScanning ? stopScanning() : startScanning())}
        >
          {isScanning ? <ThemedText>Stop Scan</ThemedText> : <ThemedText>Start Scan</ThemedText>}
        </TouchableOpacity>
        {isScanning && <ActivityIndicator style={{ marginLeft: 12 }} />}
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

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
        {allArtifactsDetected ? (
          <TouchableOpacity style={styles.cta} onPress={() => router.push('./quiz')}>
            <ThemedText type="defaultSemiBold">Take Quiz</ThemedText>
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
  button: { padding: 10, borderRadius: 8, backgroundColor: '#E6F4FE' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  cta: { padding: 10, backgroundColor: '#1D3D47', borderRadius: 8 },
  error: { color: 'red', marginVertical: 8 },
});
