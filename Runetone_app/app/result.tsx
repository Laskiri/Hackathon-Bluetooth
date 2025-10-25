import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { QUIZ_DATA } from '@/constants/quiz';
import useApi from '@/hooks/use-api';
import { useTeam } from '@/context/team';




export default function ResultScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.8)).current;
  const [displayText, setDisplayText] = useState('');
  const codeOpacity = useRef(new Animated.Value(0)).current;
  const { team } = useTeam();
  const endpoint = team ? `/api/teams/${team.id}/fragments/0` : '';
  const { data: codeFragement, get: getFragment } = useApi(endpoint);
  const [scrambleEnded, setScrambleEnded] = useState(false)

  useEffect(() => {
    if (team && getFragment) {
      // fetch fragment for this team (index 0 for now)
      try {
        getFragment();
      } catch (e) {
        // ignore
      }
    }
  }, [team, getFragment]);
  useEffect(() => {
    // don't run the animation until we actually have a fragment to show
    // entrance spring
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    const scrambleDuration = 3000; // ms
    const scrambleInterval = 150; // ms

    let scrambleTimer: ReturnType<typeof setInterval> | null = null;
    let revealTimeout: ReturnType<typeof setTimeout> | null = null;

    // show scrambling placeholder while 'decoding'
    scrambleTimer = setInterval(() => {
      // random chars of same length
      const chars = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚻᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟᚫᚪᛡᚣᚤᚥᚦᚮᚭᚯᚰᚱᚳᚴᚵᚶᚷᚸᚹᚺᛞᛟᛞᚪᚫᛝᚴᚱᚲᚷᛇᚣᚤᛗᛟᛞ';
      const len = Math.max(3, 12);
      let s = '';
      for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
      setDisplayText(s);
    }, scrambleInterval);

    // when scrambleDuration ends, clear scramble and typewriter reveal
    revealTimeout = setTimeout(() => {
      if (scrambleTimer) clearInterval(scrambleTimer);
      setScrambleEnded(true)
      setDisplayText(codeFragement.fragment)
    }, scrambleDuration);

    return () => {
      if (scrambleTimer) clearInterval(scrambleTimer);
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, [scale, codeOpacity, codeFragement]);
  const cardBackground = useThemeColor({}, 'cardBackground');
  const buttonSecondary = useThemeColor({}, 'buttonSecondary');
  const primary = useThemeColor({}, 'primary');
  const textSecondary = useThemeColor({}, 'buttonSecondary')
  const bgRune = useThemeColor({}, 'buttonPrimary')
  console.log(displayText)
  return (
    <ThemedView style={styles.container}>
        <ImageBackground
          source={require('../assets/images/jellingstone.png')}
          style={styles.runestoneImage}
          imageStyle={styles.runestoneImageInner}
        >
          <ThemedText style={[styles.code, { color: buttonSecondary, backgroundColor: bgRune, padding: 20, width: 400, height:70, alignSelf: 'center'}, {fontWeight: 900}]}>
            {displayText}
          </ThemedText>
        </ImageBackground>

      <View style={styles.controls}>
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
  runestoneImage: {
    width: 400,
    height: 800,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  runestoneImageInner: {
    borderRadius: 60,
  }
});
