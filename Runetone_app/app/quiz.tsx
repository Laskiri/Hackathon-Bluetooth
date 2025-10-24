import React, { useState, useRef, useEffect } from 'react';
import { Animated, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { QUIZ_DATA } from '@/constants/quiz';

export default function QuizScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;

  const question = QUIZ_DATA.questions[index];

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }, [index, scale]);

  function onSelectAnswer(answerId: string) {
    setSelected(answerId);
    Haptics.selectionAsync();
  }

  function onNext() {
  if (!selected) return;
  if (selected === question.correctAnswerId) setScore(s => s + 1);
    setSelected(null);
    if (index + 1 >= QUIZ_DATA.questions.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('./result');
    } else {
      setIndex(i => i + 1);
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <ThemedText type="title">Quiz</ThemedText>
        <ThemedText>{`Question ${index + 1} of ${QUIZ_DATA.questions.length}`}</ThemedText>
        <ThemedText>{`Score: ${score}`}</ThemedText>
      </Animated.View>

      <View style={styles.questionBox}>
        <ThemedText type="subtitle">{question.question}</ThemedText>
        <FlatList
          data={question.answers}
          keyExtractor={a => a.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.answerRow, selected === item.id && styles.answerSelected]}
              onPress={() => onSelectAnswer(item.id)}
            >
              <ThemedText>{item.text}</ThemedText>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <ThemedText type="defaultSemiBold">{index + 1 >= QUIZ_DATA.questions.length ? 'Finish' : 'Next'}</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  questionBox: { marginTop: 16 },
  answerRow: { padding: 12, borderRadius: 8, marginVertical: 6, backgroundColor: 'transparent' },
  answerSelected: { backgroundColor: '#E6F4FE' },
  controls: { marginTop: 20, alignItems: 'center' },
  nextButton: { padding: 10, borderRadius: 8, backgroundColor: '#1D3D47' },
});
