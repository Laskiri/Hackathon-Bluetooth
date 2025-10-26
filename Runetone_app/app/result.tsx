import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, ImageBackground, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {API_BASE} from "@/constants/api";

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { QUIZ_DATA } from '@/constants/quiz';
import useApi from '@/hooks/use-api';
import { useTeam } from '@/context/team';




export default function ResultScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.8)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const boxAnim = useRef(new Animated.Value(0)).current; // 0 scrambled or
  const [displayText, setDisplayText] = useState('');
  const codeOpacity = useRef(new Animated.Value(0)).current;
  const { team } = useTeam();
  const endpoint = team ? `/api/teams/${team.id}/fragments/0` : '';
  const { data: codeFragement, get: getFragment } = useApi(endpoint);
  const [scrambleEnded, setScrambleEnded] = useState(false)
  const [posted, setPosted] = useState(false);

  async function postCompletion() {
  if (posted || codeFragement.fragment.solved == true) return;
  const fragmentId = codeFragement?.index ?? codeFragement?.fragment?.id;
  if (!fragmentId || !team?.id) {
    console.log(codeFragement.index, team.id)
    console.warn('Missing fragmentId or team id — cannot post completion yet');
    return;
  }

  const postEndpoint = API_BASE + `/api/teams/${team.id}/runestone/${fragmentId}`; // adapt path
  try {
    setPosted(true);
    const res = await fetch(postEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // add auth header here if your API requires it
      },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });
    if (!res.ok) {
      setPosted(false); // allow retry
      const text = await res.text();
      console.error('Post failed', res.status, text);
      // optionally show a toast or set an error state
      return;
    }
    const json = await res.json();
    console.log('Post success', json);
    // optionally update UI/state
  } catch (err) {
    setPosted(false);
    console.error('Post error', err);
  }
}
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    const scrambleDuration = 3000; // ms
    const scrambleInterval = 150; // ms

    let scrambleTimer: ReturnType<typeof setInterval> | null = null;
    let revealTimeout: ReturnType<typeof setTimeout> | null = null;

    // start scrambling
    scrambleTimer = setInterval(() => {
      const chars =
        'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚻᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟᚫᚪᛡᚣᚤᚥᚦᚮᚭᚯᚰᚱᚳᚴᚵᚶᚷᚸᚹᚺᛞᛟᛞᚪᚫᛝᚴᚱᚲᚷᛇᚣᚤᛗᛟᛞ';
      const len = Math.max(3, 18);
      let s = '';
      for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
      setDisplayText(s);
    }, scrambleInterval);

    // when scrambleDuration ends, clear scramble and run reveal animation
    revealTimeout = setTimeout(() => {
      if (scrambleTimer) {
        clearInterval(scrambleTimer);
        scrambleTimer = null;
      }

      const finalText = codeFragement?.fragment?.pass_fragment ?? codeFragement?.code ?? '';

      // flash effect then animate box shape/size, then set text
      // longer decay and higher peak so the flash is noticeable
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => {
        setDisplayText(finalText);
        setScrambleEnded(true);
        postCompletion();
        Animated.timing(boxAnim, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false, // animating layout (width/height)
        }).start();
      });
    }, scrambleDuration);

    return () => {
      if (scrambleTimer) clearInterval(scrambleTimer);
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, [scale, codeOpacity, codeFragement, flashAnim, boxAnim]);
  const buttonSecondary = useThemeColor({}, 'buttonSecondary');
  const bgRune = useThemeColor({}, 'buttonPrimary')
  console.log(displayText)
  return (
    <ThemedView style={styles.container}>

      <ImageBackground
        source={require('../assets/images/jellingstone.png')}
        style={styles.runestoneImage}
        imageStyle={styles.runestoneImageInner}
      >
        <Animated.View
          style={{
            backgroundColor: bgRune,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
            borderRadius: 12,
            paddingBottom: 10,
            width: boxAnim.interpolate({ inputRange: [0, 1], outputRange: [70, 400] }),
            height: boxAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 70] }),
            overflow: 'visible',
          }}
        >
          <ThemedText style={[styles.code, { color: buttonSecondary, textAlign: 'center', fontWeight: '900', lineHeight: 39 }]}>
            {displayText}
          </ThemedText>
          
        </Animated.View>
        {scrambleEnded ? (
          <View
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              bottom: 128,
              backgroundColor: buttonSecondary,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <ThemedText style={{textAlign: 'center', fontSize: 23 }}>
              Team '{team.name}' You have successfully retrieved a part of the code — head to the Christianity room next.
            </ThemedText>
          </View>
        ) : null}
      </ImageBackground>

      <View style={styles.controls}></View>
      {/* flash overlay: placed last so it renders on top, with high zIndex/elevation */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          {
            backgroundColor: '#fff',
            zIndex: 9999,
            elevation: 9999,
            opacity: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.95] }),
          },
        ]}
      />
      
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
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
});