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
import useApi from '@/hooks/use-api';
import { useTeam } from '@/context/team';

export default function DetectionScreen() {
  const router = useRouter();
  const { detectedArtifacts, scannedDevices, isScanning, startScanning, stopScanning, allArtifactsDetected, error } = useBleScanner();
  const buttonSecondary = useThemeColor({}, 'buttonSecondary');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'border');
  const accent = useThemeColor({}, 'accent');
  const incorrectAnswer = useThemeColor({}, 'incorrectAnswer');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [ctaAnim] = useState(() => new Animated.Value(1));
  const prevCountRef = useRef(0);
  const teamRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: team, get } = useApi('/api/getLatestTeam');
  const { setTeam } = useTeam();

  useEffect(() => {
    let mounted = true;

    const clearRetry = () => {
      if (teamRetryRef.current) {
        clearTimeout(teamRetryRef.current);
        teamRetryRef.current = null;
      }
    };

    async function attempt() {
      try {
        const result = await get(); // returns parsed JSON and sets `data` inside the hook
        if (!mounted) return;
        if (result) {
          console.log('got team', result);
          try {
            setTeam(result);
          } catch (e) {
            // in case provider isn't mounted yet
            console.warn('could not set team in context', e);
          }
          clearRetry();
        } else {
          console.log('no team returned (server returned null/empty), retrying in 2s');
          clearRetry();
          teamRetryRef.current = setTimeout(attempt, 2000);
        }
      } catch (err) {
        console.warn('fetch failed, will retry in 2s', err);
        if (!mounted) return;
        clearRetry();
        teamRetryRef.current = setTimeout(attempt, 2000);
      }
    }

    attempt();

    return () => {
      mounted = false;
      clearRetry();
    };
  }, [get, setTeam]);


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
    if (allArtifactsDetected || true) {
      // small haptic to indicate completion and navigate to quiz after a moment
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(ctaAnim, { toValue: 1.06, duration: 400, useNativeDriver: true }),
          Animated.timing(ctaAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => {
        pulse.stop();
      };
    }
  }, [allArtifactsDetected, ctaAnim, router]);

  // start scanning only after we have a team
  useEffect(() => {
    if (team) {
      startScanning();
      return () => stopScanning();
    }
    // if no team yet, ensure scanning stopped
    stopScanning();
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
      <Animated.View style={[styles.artifactRow, { transform: [{ scale: found ? pulseAnim : 1 }], backgroundColor: found ? buttonPrimary : cardBackground, borderColor: border }]}>
        <View style={styles.artifactInfo}>
          <ThemedText style={[{color: found ? textSecondary : text}]} type="subtitle" >{item.name}</ThemedText>
          <ThemedText style={[{color: found ? textSecondary : text}]}> {item.description}</ThemedText>
        </View>
        <View style={styles.statusContainer}>
          {found ? (
            <ThemedText type="defaultSemiBold" style={{ color: buttonSecondary, fontSize: 48, lineHeight: 56, textAlign: 'right', marginRight: 12 }} accessibilityLabel="Found">✓</ThemedText>
          ) : (
            <ThemedText>Activate</ThemedText>
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
      <Animated.View style={[styles.header, { marginTop: 24 }]}>
        <View style={styles.headerRow}>
          <View style={[styles.teamBadge, { backgroundColor: buttonPrimary, borderColor: border, width: 350,  }]}>
            <ThemedText type="defaultSemiBold" style={{ color: textSecondary, alignSelf: 'center' }}>{team.name}</ThemedText>
            
          </View>
          {QUIZ_DATA.runestoneName ? (
            <ThemedText type="defaultSemiBold">{QUIZ_DATA.runestoneName}</ThemedText>
            ) : null}      

        </View>

        <ThemedText type="title" style={{ marginTop: 8 }}>Artifact Detection</ThemedText>

        <View style={styles.progressContainer} accessibilityRole="progressbar" accessibilityValue={{ now: progress, min: 0, max: 100 }}>
          <View style={[styles.progressBar, { backgroundColor: cardBackground, borderColor: border }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: accent }]} />
          </View>
          <ThemedText style={styles.progressText}>{progress}% found</ThemedText>
        </View>
      </Animated.View>

      {error ? <ThemedText style={[styles.error, { color: incorrectAnswer }]}>{error}</ThemedText> : null}

      <FlatList
        data={ARTIFACTS}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />

      {/* <ThemedText style={{ marginTop: 12 }} type="subtitle">Nearby Devices</ThemedText>
      <FlatList
        data={scannedDevices}
        keyExtractor={d => d.id}
        renderItem={renderDevice}
        contentContainerStyle={{ paddingVertical: 8 }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      /> */}

  <View style={styles.footer}>
        {allArtifactsDetected || true ? (
          <Animated.View style={{ transform: [{ scale: ctaAnim }] }}>
            <TouchableOpacity
              style={[
                styles.cta,
                styles.ctaActive,
                {
                  backgroundColor: buttonPrimary,
                  borderColor: accent,
                  borderWidth: 2,
                  shadowColor: accent,
                  shadowOpacity: 0.35,
                  shadowRadius: 18,
                  width: 350,
                  height: 120,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 72,


                },
              ]}
              onPress={() => router.push('./quiz')}
              accessibilityRole="button"
              accessibilityLabel="Take Quiz"
            >
              <ThemedText type="defaultSemiBold" style={{ color: buttonSecondary, fontSize: 32, fontWeight: 900 }}>
                Take Quiz
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, },
  header: { alignItems: 'center', marginBottom: 12 },
  list: { paddingVertical: 8 },
  artifactRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: 'transparent' },
  artifactInfo: { flex: 1 },
  statusContainer: { width: 90, alignItems: 'flex-end' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 },
  sep: { height: 8 },
  controls: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  button: { padding: 10, borderRadius: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, },
  cta: { padding: 10, borderRadius: 8 },
  error: { marginVertical: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'column', width: '100%', justifyContent: 'space-between', alignItems: 'center' },
  teamBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  progressContainer: { width: '100%', marginTop: 12, alignItems: 'center' },
  progressBar: { width: '100%', height: 10, borderRadius: 8, overflow: 'hidden', borderWidth: 1 },
  progressFill: { height: '100%', borderRadius: 8 },
  progressText: { marginTop: 6 },
  ctaActive: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, elevation: 6, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});
